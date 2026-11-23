using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Gise.Web.Services;

public record CopyRequest(string Title, string Category, string? Venue, string? District, string? Artist);
public record CopyResult(string Description, string Rules, string Tags, string Source);

/// <summary>
/// FR-07 AI copywriter for the organizer form. When Gise:Ai:ApiKey is configured it calls the
/// Anthropic Messages API with a 4-second timeout (NFR-05); otherwise, or if the call fails, it
/// falls back to a built-in template so the form never blocks.
/// </summary>
public class CopywriterService(IConfiguration config, IHttpClientFactory http, ILogger<CopywriterService> log)
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(4);

    public async Task<CopyResult> WriteAsync(CopyRequest r, CancellationToken ct)
    {
        var key = config["Gise:Ai:ApiKey"];
        if (!string.IsNullOrWhiteSpace(key))
        {
            try { return await CallLlmAsync(r, key, ct); }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException or InvalidOperationException)
            {
                log.LogWarning(ex, "AI copywriter failed, using template fallback");
            }
        }
        await Task.Delay(600, ct); // keep the UI's loading state visible in demos
        return Template(r);
    }

    private async Task<CopyResult> CallLlmAsync(CopyRequest r, string key, CancellationToken ct)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(Timeout);
        var client = http.CreateClient();
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        req.Headers.Add("x-api-key", key);
        req.Headers.Add("anthropic-version", "2023-06-01");
        var prompt = $$"""
            Bir etkinlik bilet platformu için Türkçe tanıtım metni yaz. Yalnızca şu JSON'u döndür:
            {"description":"2 kısa paragraf","rules":"giriş kuralları, tek paragraf","tags":"#Etiket #Etiket #Etiket"}
            Etkinlik: {{r.Title}}. Kategori: {{r.Category}}. Sanatçı: {{r.Artist ?? "-"}}. Mekân: {{r.Venue ?? "-"}}, {{r.District ?? "İstanbul"}}.
            """;
        req.Content = JsonContent.Create(new
        {
            model = config["Gise:Ai:Model"] ?? "claude-haiku-5-5",
            max_tokens = 600,
            messages = new[] { new { role = "user", content = prompt } }
        });
        using var res = await client.SendAsync(req, cts.Token);
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<JsonObject>(cts.Token) ?? throw new JsonException("empty body");
        var text = body["content"]?[0]?["text"]?.GetValue<string>() ?? throw new JsonException("no text");
        var json = JsonNode.Parse(text[text.IndexOf('{')..(text.LastIndexOf('}') + 1)])!;
        return new CopyResult(json["description"]!.GetValue<string>(), json["rules"]!.GetValue<string>(), json["tags"]!.GetValue<string>(), "llm");
    }

    private static CopyResult Template(CopyRequest r)
    {
        var place = string.IsNullOrWhiteSpace(r.Venue) ? "İstanbul'un sevilen sahnelerinden birinde" : $"{r.Venue}{(string.IsNullOrWhiteSpace(r.District) ? "" : ", " + r.District)} sahnesinde";
        var who = string.IsNullOrWhiteSpace(r.Artist) ? "" : $" {r.Artist} ile";
        var (mood, extra, rules, tags) = r.Category switch
        {
            "Konser" => ("canlı müziğin enerjisini en yakından hissedeceğin", "Set listesi, yeni şarkılar ve sevilen klasiklerden oluşuyor; bis için enerjini sakla.", "Kapılar etkinlikten 45 dakika önce açılır. Profesyonel kamera ve kayıt cihazı alınmaz. 18 yaş altı katılımcılar bir veliyle girebilir.", "#CanlıMüzik #Konser #İstanbul"),
            "Tiyatro" => ("sahne ile seyircinin arasındaki mesafenin kaybolduğu", "Oyun iki perde ve bir aradan oluşuyor; toplam süre yaklaşık 2 saat.", "Oyun başladıktan sonra salona giriş yapılamaz. Fotoğraf ve video çekimi yasaktır.", "#Tiyatro #Sahne #Kültür"),
            "Komedi" => ("kahkahanın hiç eksik olmadığı", "Gösteri yaklaşık 90 dakika sürüyor; gösteri Türkçe.", "Gösteri sırasında kayıt alınmaz; telefonlar sessize alınmalıdır. +16 yaş sınırı uygulanır.", "#StandUp #Komedi #Gece"),
            "Klasik" => ("büyük bir orkestranın tınısıyla dolu", "Program iki bölümden oluşuyor; arada 20 dakikalık bir ara var.", "Konser başladıktan sonra girişler bölüm arasında yapılır. 7 yaş altı çocuklar salona alınmaz.", "#Klasik #Orkestra #Konser"),
            "Festival" => ("bütün gün sürecek", "Gün boyunca farklı sahnelerde performanslar ve atölyeler var.", "Bileklik girişte verilir ve gün boyunca takılı kalmalıdır. Dışarıdan yiyecek-içecek alınmaz.", "#Festival #AçıkHava #HaftaSonu"),
            "Spor" => ("tribünlerin sesinin hiç dinmediği", "Isınma ve takım tanıtımları maçtan 30 dakika önce başlıyor.", "Kapılar maçtan 90 dakika önce açılır. Yanıcı madde ve meşale sokmak yasaktır.", "#Spor #Maç #Tribün"),
            "Atölye" => ("öğrenip hemen uygulayacağın", "Küçük bir grupla, eğitmenle birebir çalışma fırsatı.", "Kontenjan sınırlıdır; geç gelen katılımcılar ilk bölümü kaçırabilir. Gerekli malzemeler etkinlik sayfasında listelenir.", "#Atölye #Öğren #Uygulama"),
            "Konferans" => ("ilham veren konuşmalar ve yeni bağlantılarla geçecek", "Program ana oturumlar, paneller ve networking aralarından oluşuyor.", "Giriş için QR kodlu bilet ve kimlik gereklidir. Yaka kartı gün boyunca takılı olmalıdır.", "#Konferans #Teknoloji #Networking"),
            _ => ("bütün ailenin keyifle katılacağı", "Etkinlik çocuklar ve yetişkinler için ayrı bölümler içeriyor.", "Her çocuğa bir yetişkin eşlik etmelidir. Bebek arabası için ayrı bir alan vardır.", "#Aile #Çocuk #HaftaSonu"),
        };
        var description = $"{r.Title}, {place}{who} {mood} bir akşam vaat ediyor. {extra}\n\nBiletler sınırlı sayıda; QR kodlu biletin Gişe profilinde hazır olacak, girişte telefonundan göstermen yeterli.";
        return new CopyResult(description, rules, tags, "template");
    }
}
