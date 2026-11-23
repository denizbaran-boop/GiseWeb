using System.ComponentModel.DataAnnotations;
using Gise.Web.Models;
using Gise.Web.Services;

namespace Gise.Web.ViewModels;

public record StatusVm(int Code, string? Message = null, string? TraceId = null);

// ---------- Validation attributes -------------------------------------------

/// <summary>Credit card number check (Luhn checksum, 13–19 digits).</summary>
public class LuhnAttribute : ValidationAttribute
{
    public LuhnAttribute() : base("Kart numarası geçerli değil; 16 haneyi kontrol et.") { }
    public override bool IsValid(object? value)
    {
        if (value is not string s) return value is null;
        var digits = s.Where(char.IsDigit).Select(c => c - '0').ToArray();
        if (digits.Length is < 13 or > 19 || s.Any(c => !char.IsDigit(c) && c != ' ')) return false;
        int sum = 0;
        for (int i = 0; i < digits.Length; i++)
        {
            int d = digits[digits.Length - 1 - i];
            if (i % 2 == 1) { d *= 2; if (d > 9) d -= 9; }
            sum += d;
        }
        return sum % 10 == 0;
    }
}

/// <summary>MM/YY expiry that is not in the past.</summary>
public class CardExpiryAttribute : ValidationAttribute
{
    public CardExpiryAttribute() : base("Son kullanma tarihini AA/YY biçiminde gir.") { }
    protected override ValidationResult? IsValid(object? value, ValidationContext ctx)
    {
        if (value is not string s) return ValidationResult.Success;
        var p = s.Split('/');
        if (p.Length != 2 || !int.TryParse(p[0], out var m) || !int.TryParse(p[1], out var y) || m is < 1 or > 12 || p[1].Length != 2)
            return new ValidationResult(ErrorMessage, [ctx.MemberName!]);
        var now = ctx.GetService<IClock>()?.Now ?? DateTime.Now;
        var lastDay = new DateTime(2000 + y, m, 1).AddMonths(1);
        return lastDay <= now ? new ValidationResult("Kartının son kullanma tarihi geçmiş.", [ctx.MemberName!]) : ValidationResult.Success;
    }
}

public class MustBeTrueAttribute : ValidationAttribute
{
    public override bool IsValid(object? value) => value is true;
}

public static class Rules
{
    public const string UsernamePattern = @"^[A-Za-z0-9._]{3,20}$";
    public const string UsernameMessage = "Kullanıcı adı 3–20 karakter olmalı; harf, rakam, nokta ve alt çizgi kullanabilirsin.";
    public const string PasswordPattern = @"^(?=.*[A-ZÇĞİÖŞÜ])(?=.*\d).{8,100}$";
    public const string PasswordMessage = "Şifre en az 8 karakter olmalı, bir büyük harf ve bir rakam içermeli.";
}

// ---------- Account -----------------------------------------------------------

public class LoginVm
{
    [Required(ErrorMessage = "E-posta veya kullanıcı adını gir.")]
    [StringLength(120)]
    public string Login { get; set; } = "";

    [Required(ErrorMessage = "Şifreni gir.")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = "";

    public bool RememberMe { get; set; } = true;
    public string? ReturnUrl { get; set; }
}

public class RegisterVm : IValidatableObject
{
    [Required(ErrorMessage = "Ad soyadını gir."), StringLength(80, MinimumLength = 3, ErrorMessage = "Ad soyad 3–80 karakter olmalı.")]
    public string FullName { get; set; } = "";

    [Required(ErrorMessage = "Kullanıcı adı seç."), RegularExpression(Rules.UsernamePattern, ErrorMessage = Rules.UsernameMessage)]
    public string Username { get; set; } = "";

    [Required(ErrorMessage = "E-posta adresini gir."), EmailAddress(ErrorMessage = "E-posta adresi geçerli görünmüyor; ad@ornek.com biçiminde gir."), StringLength(120)]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Şifre belirle."), RegularExpression(Rules.PasswordPattern, ErrorMessage = Rules.PasswordMessage)]
    public string Password { get; set; } = "";

    public UserRole AccountType { get; set; } = UserRole.Attendee;

    [StringLength(80, ErrorMessage = "Kurum adı en fazla 80 karakter olabilir.")]
    public string? OrganizationName { get; set; }

    [MustBeTrue(ErrorMessage = "Devam etmek için koşulları kabul et.")]
    public bool AcceptTerms { get; set; }

    public string? ReturnUrl { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
    {
        if (AccountType == UserRole.Admin)
            yield return new ValidationResult("Admin hesabı kayıt formundan açılamaz.", [nameof(AccountType)]);
        if (AccountType == UserRole.Organizer && string.IsNullOrWhiteSpace(OrganizationName))
            yield return new ValidationResult("Organizatör hesabı için kurum veya sahne adını gir.", [nameof(OrganizationName)]);
    }
}

public class ChangeUsernameVm
{
    [Required(ErrorMessage = "Yeni kullanıcı adını gir."), RegularExpression(Rules.UsernamePattern, ErrorMessage = Rules.UsernameMessage)]
    public string Username { get; set; } = "";
}

public class ChangeEmailVm
{
    [Required(ErrorMessage = "Yeni e-posta adresini gir."), EmailAddress(ErrorMessage = "E-posta geçerli görünmüyor; ad@ornek.com biçiminde gir."), StringLength(120)]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Değişikliği onaylamak için mevcut şifreni gir.")]
    public string CurrentPassword { get; set; } = "";
}

public class ChangePasswordVm
{
    [Required(ErrorMessage = "Mevcut şifreni gir.")]
    public string CurrentPassword { get; set; } = "";

    [Required(ErrorMessage = "Yeni şifreni gir."), RegularExpression(Rules.PasswordPattern, ErrorMessage = "Yeni şifre kuralların hepsini karşılamalı.")]
    public string NewPassword { get; set; } = "";

    [Required(ErrorMessage = "Yeni şifreyi tekrar gir."), Compare(nameof(NewPassword), ErrorMessage = "Yeni şifreler aynı değil.")]
    public string ConfirmPassword { get; set; } = "";
}

public record PreferencesVm(bool RemindersEnabled);

// ---------- Events ------------------------------------------------------------

public class TierFormVm
{
    /// <summary>Existing tier id when editing; null for a new tier.</summary>
    public int? Id { get; set; }

    [Required(ErrorMessage = "Bilet türü adını gir."), StringLength(30, ErrorMessage = "Bilet türü adı en fazla 30 karakter.")]
    public string Name { get; set; } = "";

    [Required(ErrorMessage = "Fiyat gir."), Range(1, 100_000, ErrorMessage = "Fiyat 1 ile 100.000 ₺ arasında olmalı.")]
    public int? Price { get; set; }

    [Required(ErrorMessage = "Kontenjan gir."), Range(1, 100_000, ErrorMessage = "Kontenjan 1 ile 100.000 arasında olmalı.")]
    public int? Capacity { get; set; }

    [StringLength(80)]
    public string? Description { get; set; }
}

public class EventFormVm : IValidatableObject
{
    /// <summary>Set when editing an existing event.</summary>
    public int? Id { get; set; }
    public bool IsEdit => Id is > 0;
    /// <summary>Cover of the event being edited (shown as the "keep current" option).</summary>
    public string? CurrentCover { get; set; }
    public EventStatus? CurrentStatus { get; set; }

    [Required(ErrorMessage = "Etkinlik adını gir."), StringLength(60, MinimumLength = 3, ErrorMessage = "Etkinlik adı 3–60 karakter olmalı.")]
    public string Title { get; set; } = "";

    [Required] public string Category { get; set; } = "Konser";
    [Required] public string AgeLimit { get; set; } = "Herkes";

    [Required(ErrorMessage = "Açıklama yaz ya da AI ile oluştur."), StringLength(2000, MinimumLength = 20, ErrorMessage = "Açıklama 20–2000 karakter olmalı.")]
    public string Description { get; set; } = "";

    [StringLength(200, ErrorMessage = "Etiketler en fazla 200 karakter.")]
    public string? Tags { get; set; }

    [Required(ErrorMessage = "Tarih seç.")] public DateOnly? Date { get; set; }
    [Required(ErrorMessage = "Saat seç.")] public TimeOnly? Time { get; set; } = new(20, 0);
    public TimeOnly? Doors { get; set; }

    [Required(ErrorMessage = "Mekânı gir."), StringLength(80, ErrorMessage = "Mekân adı en fazla 80 karakter.")]
    public string Venue { get; set; } = "";

    [Required(ErrorMessage = "İlçeyi gir."), StringLength(40, ErrorMessage = "İlçe en fazla 40 karakter.")]
    public string District { get; set; } = "";

    /// <summary>1–12 = preset cover; 0 = keep the current cover (edit only).</summary>
    [Range(0, Catalog.CoverPresets)] public int CoverPreset { get; set; } = 1;
    public IFormFile? CoverUpload { get; set; }

    public List<TierFormVm> Tiers { get; set; } = [new() { Name = "Tam" }];

    /// <summary>"publish", "draft" or "save" (keep current status) — which submit button was used.</summary>
    public string Intent { get; set; } = "publish";

    public const long MaxCoverBytes = 3 * 1024 * 1024;
    public static readonly string[] CoverTypes = ["image/jpeg", "image/png", "image/webp"];

    public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
    {
        if (!Catalog.Categories.Contains(Category)) yield return new("Listeden bir kategori seç.", [nameof(Category)]);
        if (!Catalog.AgeLimits.Contains(AgeLimit)) yield return new("Listeden bir yaş sınırı seç.", [nameof(AgeLimit)]);
        if (CoverPreset == 0 && !IsEdit && CoverUpload is null) yield return new("Bir kapak görseli seç.", [nameof(CoverUpload)]);

        var now = ctx.GetService<IClock>()?.Now ?? DateTime.Now;
        if (Date is { } d && Time is { } t)
        {
            var start = d.ToDateTime(t);
            if (start < now.AddHours(2)) yield return new("Etkinlik en az 2 saat sonrası için planlanmalı.", [nameof(Date)]);
            if (start > now.AddYears(2)) yield return new("En fazla 2 yıl sonrası için etkinlik açabilirsin.", [nameof(Date)]);
            if (Doors is { } doors && doors > t) yield return new("Kapı açılışı etkinlik saatinden sonra olamaz.", [nameof(Doors)]);
        }

        if (Tiers.Count == 0) yield return new("En az bir bilet türü ekle.", [nameof(Tiers)]);
        if (Tiers.Count > 5) yield return new("En fazla 5 bilet türü ekleyebilirsin.", [nameof(Tiers)]);
        var dup = Tiers.GroupBy(x => x.Name.Trim(), StringComparer.OrdinalIgnoreCase).FirstOrDefault(g => g.Key != "" && g.Count() > 1);
        if (dup is not null) yield return new($"\"{dup.Key}\" bilet türü iki kez yazılmış.", [nameof(Tiers)]);

        if (CoverUpload is { } f)
        {
            if (f.Length > MaxCoverBytes) yield return new("Kapak görseli en fazla 3 MB olabilir.", [nameof(CoverUpload)]);
            else if (!CoverTypes.Contains(f.ContentType)) yield return new("Kapak görseli JPG, PNG ya da WEBP olmalı.", [nameof(CoverUpload)]);
        }
    }
}

// ---------- API requests -----------------------------------------------------

public class HoldLineVm
{
    [Range(1, int.MaxValue)] public int TierId { get; set; }
    [Range(0, TicketingService.MaxPerUserPerEvent, ErrorMessage = "Bir bilet türünden en fazla 6 adet seçebilirsin.")] public int Quantity { get; set; }
}

public class HoldRequest
{
    [Range(1, int.MaxValue)] public int EventId { get; set; }
    [Required, MinLength(1, ErrorMessage = "En az bir bilet seç.")] public List<HoldLineVm> Lines { get; set; } = [];
}

public class PayRequest
{
    [Required(ErrorMessage = "Kart üzerindeki adı gir."), StringLength(60, MinimumLength = 3, ErrorMessage = "Kart üzerindeki ad 3–60 karakter olmalı.")]
    public string CardName { get; set; } = "";

    [Required(ErrorMessage = "Kart numarasını gir."), Luhn]
    public string CardNumber { get; set; } = "";

    [Required(ErrorMessage = "Son kullanma tarihini gir."), CardExpiry]
    public string Expiry { get; set; } = "";

    [Required(ErrorMessage = "CVC kodunu gir."), RegularExpression(@"^\d{3,4}$", ErrorMessage = "CVC 3 ya da 4 haneli olmalı.")]
    public string Cvc { get; set; } = "";
}

public class BanRequest
{
    [Required, RegularExpression("^(7|30|perm)$", ErrorMessage = "Süre 7 gün, 30 gün ya da kalıcı olmalı.")]
    public string Duration { get; set; } = "7";

    [Required(ErrorMessage = "Bir sebep seç.")]
    public string Reason { get; set; } = "";

    [StringLength(300, ErrorMessage = "Not en fazla 300 karakter olabilir.")]
    public string? Note { get; set; }

    public static readonly string[] Reasons = ["Spam", "Bilet karaborsası", "Sahte hesap", "Taciz veya kötü davranış", "Diğer"];
}

public class CheckInRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Etkinlik seç.")] public int EventId { get; set; }
    [Required(ErrorMessage = "Bilet kodunu gir ya da QR okut."), StringLength(80)] public string Code { get; set; } = "";
}

public class CopyRequestVm
{
    [Required(ErrorMessage = "Önce etkinlik adını yaz."), StringLength(60, MinimumLength = 3, ErrorMessage = "Önce etkinlik adını yaz (en az 3 karakter).")]
    public string Title { get; set; } = "";
    [Required] public string Category { get; set; } = "Konser";
    [StringLength(80)] public string? Venue { get; set; }
    [StringLength(40)] public string? District { get; set; }
    [StringLength(60)] public string? Artist { get; set; }
}
