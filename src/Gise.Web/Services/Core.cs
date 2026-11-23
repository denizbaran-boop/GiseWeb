using System.Security.Cryptography;
using System.Text;
using Gise.Web.Data;
using Gise.Web.Models;
using QRCoder;

namespace Gise.Web.Services;

/// <summary>A business-rule violation the user can fix; becomes a ProblemDetails response.</summary>
public class DomainException(string message, int statusCode = StatusCodes.Status400BadRequest, string? field = null) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string? Field { get; } = field;
}

/// <summary>Istanbul wall-clock time, independent of the server's time zone.</summary>
public interface IClock { DateTime Now { get; } }

public class IstanbulClock : IClock
{
    private static readonly TimeZoneInfo Tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");
    public DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Tz);
}

public static class Passwords
{
    // NFR-02: bcrypt with a work factor of at least 10.
    private const int WorkFactor = 11;
    public static string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    public static bool Verify(string password, string hash)
    {
        try { return BCrypt.Net.BCrypt.Verify(password, hash); }
        catch (BCrypt.Net.SaltParseException) { return false; }
    }
}

public static class Codes
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
    public static string Random(int length)
    {
        Span<char> s = stackalloc char[length];
        for (int i = 0; i < length; i++) s[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        return new string(s);
    }
    public static string OrderCode() => "GS-" + Random(6);
    public static string TicketCode() => Random(4) + "-" + Random(4);
}

/// <summary>Signs ticket codes so a QR payload can't be forged by guessing codes (FR-06).</summary>
public class TicketTokenService(IConfiguration config)
{
    private readonly byte[] _key = Encoding.UTF8.GetBytes(config["Gise:TicketSecret"] ?? "dev-only-secret-change-me");

    public string TokenFor(string ticketCode) => $"GISE:{ticketCode}:{Sign(ticketCode)}";

    /// <summary>Accepts a full QR token or a bare ticket code typed at the door. Returns the ticket code, or null if the signature is wrong.</summary>
    public string? Parse(string input)
    {
        input = input.Trim().ToUpperInvariant();
        var parts = input.Split(':');
        if (parts.Length == 3 && parts[0] == "GISE")
            return CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(Sign(parts[1])), Encoding.ASCII.GetBytes(parts[2])) ? parts[1] : null;
        var bare = input.Replace(" ", "");
        if (bare.Length == 8 && !bare.Contains('-')) bare = bare[..4] + "-" + bare[4..];
        return bare.Length == 9 ? bare : null;
    }

    private string Sign(string code)
    {
        var mac = HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(mac, 0, 6);
    }
}

public class QrService
{
    public string Svg(string payload)
    {
        using var gen = new QRCodeGenerator();
        using var data = gen.CreateQrCode(payload, QRCodeGenerator.ECCLevel.M);
        var svg = new SvgQRCode(data).GetGraphic(new System.Drawing.Size(168, 168), "#000000", "#FFFFFF", drawQuietZones: false, sizingMode: SvgQRCode.SizingMode.ViewBoxAttribute);
        return svg.Replace("<svg ", "<svg role=\"img\" aria-label=\"Bilet QR kodu\" ");
    }
}

public class AuditService(GiseDbContext db, IClock clock)
{
    public void Log(int? actorId, string actorName, string action, string detail) =>
        db.AuditLogs.Add(new AuditLog { ActorId = actorId, ActorName = actorName, Action = action, Detail = detail.Length > 300 ? detail[..300] : detail, CreatedAt = clock.Now });
}

public static class Text
{
    /// <summary>Turkish-aware search folding: "Kadıköy" and "kadikoy" compare equal.</summary>
    public static string Fold(string? s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        var sb = new StringBuilder(s.Length);
        foreach (var c in s)
            sb.Append(c switch
            {
                'İ' or 'I' or 'ı' => 'i',
                'Ç' or 'ç' => 'c', 'Ğ' or 'ğ' => 'g', 'Ö' or 'ö' => 'o', 'Ş' or 'ş' => 's', 'Ü' or 'ü' => 'u',
                'Â' or 'â' => 'a', 'Î' or 'î' => 'i', 'Û' or 'û' => 'u',
                _ => char.ToLowerInvariant(c)
            });
        return sb.ToString();
    }
}
