using System.Globalization;
using System.Net;
using Microsoft.AspNetCore.Html;

namespace Gise.Web.Helpers;

/// <summary>View helpers shared by Razor views: icons, logo, avatars and Turkish formatting.</summary>
public static class Ui
{
    private static readonly string[] Mon = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    private static readonly string[] MonL = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    private static readonly string[] Day = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    private static readonly string[] DayL = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    private static readonly NumberFormatInfo TrNum = new() { NumberGroupSeparator = ".", NumberDecimalSeparator = "," };

    public static string Num(int n) => n.ToString("#,0", TrNum);
    public static string Tl(int n) => "₺" + Num(n);
    public static string ShortDate(DateTime d) => $"{Day[(int)d.DayOfWeek]}, {d.Day} {Mon[d.Month - 1]} · {d:HH:mm}";
    public static string LongDate(DateTime d) => $"{DayL[(int)d.DayOfWeek]}, {d.Day} {MonL[d.Month - 1]} {d.Year}";
    public static string DayMonth(DateTime d) => $"{d.Day} {Mon[d.Month - 1]}";
    public static string DayMonthYear(DateTime d) => $"{d.Day} {Mon[d.Month - 1]} {d.Year}";
    public static string MonthYear(DateTime d) => $"{MonL[d.Month - 1]} {d.Year}";
    public static string MonthShortUpper(DateTime d) => TrUpper(Mon[d.Month - 1]);
    public static string DateTimeShort(DateTime d) => $"{d:dd.MM.yyyy HH:mm}";

    /// <summary>Turkish upper-casing without depending on ICU culture data (i → İ, ı → I).</summary>
    public static string TrUpper(string s) => string.Concat(s.Select(c => c switch { 'i' => 'İ', 'ı' => 'I', _ => char.ToUpperInvariant(c) }));

    public static string Initials(string name) =>
        TrUpper(string.Concat(name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(p => p[0])));

    private static readonly (string, string)[] Av = [("#FF5C8A", "#C81E52"), ("#5E5CE6", "#3634A3"), ("#30B0C7", "#0A7C8C"), ("#FF9F0A", "#C93400"), ("#34C759", "#1F7A35"), ("#BF5AF2", "#8944AB")];
    public static string AvatarBg(string name)
    {
        uint h = 0;
        foreach (var c in name) h = unchecked(h * 31 + c);
        var p = Av[h % Av.Length];
        return $"linear-gradient(145deg,{p.Item1},{p.Item2})";
    }
    public static IHtmlContent Avatar(string name, string cls = "") =>
        new HtmlString($"<span class=\"avatar {cls}\" style=\"background:{AvatarBg(name)}\" aria-hidden=\"true\">{WebUtility.HtmlEncode(Initials(name))}</span>");

    public static readonly Dictionary<string, string> Paths = new()
    {
        ["search"] = "<circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"m15.5 15.5 4.5 4.5\"/>",
        ["compass"] = "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"m15.5 8.5-2 5-5 2 2-5z\"/>",
        ["person"] = "<circle cx=\"12\" cy=\"8.5\" r=\"3.8\"/><path d=\"M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6\"/>",
        ["plus"] = "<path d=\"M12 5v14M5 12h14\"/>",
        ["plusSq"] = "<rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"5\"/><path d=\"M12 8v8M8 12h8\"/>",
        ["shield"] = "<path d=\"M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z\"/><path d=\"m9 12 2.2 2.2L15.5 10\"/>",
        ["cal"] = "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15.5\" rx=\"4\"/><path d=\"M3.5 10h17M8 3v4M16 3v4\"/>",
        ["clock"] = "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V12l3 2\"/>",
        ["pin"] = "<path d=\"M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z\"/><circle cx=\"12\" cy=\"10\" r=\"2.4\"/>",
        ["ticket"] = "<path d=\"M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5z\"/><path d=\"M14.5 6v12\" stroke-dasharray=\"1.6 2.2\"/>",
        ["chevL"] = "<path d=\"m14.5 5-7 7 7 7\"/>",
        ["chevR"] = "<path d=\"m9.5 5 7 7-7 7\"/>",
        ["check"] = "<path d=\"m5 12.5 4.5 4.5L19 7.5\"/>",
        ["x"] = "<path d=\"m6.5 6.5 11 11M17.5 6.5l-11 11\"/>",
        ["minus"] = "<path d=\"M5 12h14\"/>",
        ["gear"] = "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6\"/>",
        ["bell"] = "<path d=\"M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z\"/><path d=\"M10 20.5a2.2 2.2 0 0 0 4 0\"/>",
        ["out"] = "<path d=\"M14 4.5H7.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14\"/><path d=\"M11 12h9.5M17 8.5l3.5 3.5-3.5 3.5\"/>",
        ["card"] = "<rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"3\"/><path d=\"M3 10h18M7 15h3\"/>",
        ["info"] = "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 11v5.5M12 7.8v.2\"/>",
        ["people"] = "<circle cx=\"9\" cy=\"9\" r=\"3.2\"/><path d=\"M3.5 19c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7\"/><circle cx=\"16.5\" cy=\"8\" r=\"2.6\"/><path d=\"M15.8 13.6c2.4.1 4.3 1.6 4.8 4.4\"/>",
        ["slash"] = "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"m6 6 12 12\"/>",
        ["photo"] = "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"4\"/><circle cx=\"9\" cy=\"9.5\" r=\"1.7\"/><path d=\"m4 17 5-4.5 4 3.5 2.5-2 4.5 3.5\"/>",
        ["trash"] = "<path d=\"M5 7h14M10 4h4M7 7l.8 12a2 2 0 0 0 2 1.8h4.4a2 2 0 0 0 2-1.8L17 7\"/>",
        ["qr"] = "<rect x=\"4\" y=\"4\" width=\"6\" height=\"6\" rx=\"1.4\"/><rect x=\"14\" y=\"4\" width=\"6\" height=\"6\" rx=\"1.4\"/><rect x=\"4\" y=\"14\" width=\"6\" height=\"6\" rx=\"1.4\"/><path d=\"M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2\"/>",
        ["eye"] = "<path d=\"M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
        ["arrowUR"] = "<path d=\"M8 16 16 8M9 8h7v7\"/>",
        ["envelope"] = "<rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"3\"/><path d=\"m4 7.5 8 6 8-6\"/>",
        ["lock"] = "<rect x=\"5\" y=\"10.5\" width=\"14\" height=\"10\" rx=\"3\"/><path d=\"M8 10.5V8a4 4 0 0 1 8 0v2.5\"/>",
        ["sun"] = "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4\"/>",
        ["moon"] = "<path d=\"M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5a7.8 7.8 0 1 0 10 10z\"/>",
        ["circleHalf"] = "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 3.5v17a8.5 8.5 0 0 0 0-17z\" fill=\"currentColor\"/>",
        ["sparkle"] = "<path d=\"M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5z\"/>",
        ["scan"] = "<path d=\"M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16M4 12h16\"/>",
        ["chart"] = "<path d=\"M4 20h16\"/><rect x=\"6\" y=\"11\" width=\"3\" height=\"6\" rx=\"1\"/><rect x=\"11\" y=\"7\" width=\"3\" height=\"10\" rx=\"1\"/><rect x=\"16\" y=\"4\" width=\"3\" height=\"13\" rx=\"1\"/>",
        ["list"] = "<path d=\"M9 6h11M9 12h11M9 18h11\"/><circle cx=\"4.5\" cy=\"6\" r=\"1\"/><circle cx=\"4.5\" cy=\"12\" r=\"1\"/><circle cx=\"4.5\" cy=\"18\" r=\"1\"/>",
        ["undo"] = "<path d=\"M9 14 4 9l5-5\"/><path d=\"M4 9h10.5a5.5 5.5 0 0 1 0 11H11\"/>",
    };

    public static IHtmlContent Icon(string name, string cls = "", double w = 1.8) =>
        new HtmlString($"<span class=\"i {cls}\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"{w.ToString(CultureInfo.InvariantCulture)}\" stroke-linecap=\"round\" stroke-linejoin=\"round\">{Paths[name]}</svg></span>");

    private static int _logoSeq;
    public static IHtmlContent Logo(int size = 32)
    {
        var id = "lg" + Interlocked.Increment(ref _logoSeq);
        return new HtmlString($"<svg width=\"{size}\" height=\"{size}\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><defs><linearGradient id=\"{id}\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#FF4F7E\"/><stop offset=\".55\" stop-color=\"#C81E52\"/><stop offset=\"1\" stop-color=\"#6E1238\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"15\" fill=\"url(#{id})\"/><path d=\"M15 21a4 4 0 0 1 4-4h26a4 4 0 0 1 4 4v5.2a5.8 5.8 0 0 0 0 11.6V43a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4v-5.2a5.8 5.8 0 0 0 0-11.6z\" fill=\"#fff\"/><path d=\"M39 19.5v25\" stroke=\"#C81E52\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-dasharray=\"0.1 5\"/><path d=\"M27 25.5l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z\" fill=\"#C81E52\"/></svg>");
    }
}
