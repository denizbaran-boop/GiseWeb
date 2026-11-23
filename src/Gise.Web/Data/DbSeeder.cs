using Gise.Web.Models;
using Gise.Web.Services;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Data;

/// <summary>
/// Demo data matching the Project #2 prototype. Event dates are relative to the first run,
/// so the catalog is always in the future. Every demo account uses the password <see cref="DemoPassword"/>.
/// </summary>
public static class DbSeeder
{
    public const string DemoPassword = "Gise2026!";

    public static async Task SeedAsync(GiseDbContext db, IClock clock)
    {
        if (await db.Users.AnyAsync()) return;

        var now = clock.Now;
        var today = now.Date;
        var hash = Passwords.Hash(DemoPassword);
        User U(string name, string user, string mail, UserRole role, int daysAgo, string? org = null) =>
            new() { FullName = name, Username = user, Email = mail, Role = role, OrganizationName = org, PasswordHash = hash, CreatedAt = today.AddDays(-daysAgo).AddHours(10) };

        var elif = U("Elif Kaya", "elifkaya", "elif.kaya@ornek.com", UserRole.Attendee, 437);
        var mert = U("Mert Aydın", "sahnekolektif", "mert@sahnekolektif.com", UserRole.Organizer, 630, "Sahne Kolektif");
        var can = U("Can Demir", "candemir", "can.demir@ornek.com", UserRole.Attendee, 33);
        var selin = U("Selin Öztürk", "selinozturk", "selin.ozturk@ornek.com", UserRole.Attendee, 138);
        var burak = U("Burak Şahin", "gulumse", "burak@gulumse.co", UserRole.Organizer, 310, "Gülümse Ajans");
        var defne = U("Defne Yıldız", "defney", "defne.y@ornek.com", UserRole.Attendee, 25);
        var emre = U("Emre Koç", "emrekoc", "emrekoc@ornek.com", UserRole.Attendee, 193);
        var ayse = U("Ayşe Çelik", "aysecelik", "ayse.celik@ornek.com", UserRole.Attendee, 294);
        var zeynep = U("Zeynep Arslan", "zeynep", "zeynep@gise.app", UserRole.Admin, 687);
        var kaan = U("Kaan Aksoy", "kaanaksoy", "kaan.aksoy@ornek.com", UserRole.Attendee, 96);
        can.BannedAt = today.AddDays(-3); can.BannedUntil = today.AddDays(11); can.BanReason = "Bilet karaborsası"; can.BanNote = "Aynı etkinlik için 31 bilet, ikinci el sitede satışta.";
        emre.BannedAt = today.AddDays(-40); emre.BanReason = "Sahte hesap";

        var mavi = U("Deniz Aksu", "mavinota", "iletisim@mavinota.com", UserRole.Organizer, 400, "Mavi Nota Prodüksiyon");
        var moda = U("Oya Er", "modasahnesi", "bilet@modasahnesi.com", UserRole.Organizer, 500, "Moda Sahnesi");
        var techist = U("Arda Güneş", "techist", "hello@techist.org", UserRole.Organizer, 220, "TechIST");
        var rihtim = U("Seda Kurt", "rihtim", "info@rihtimetkinlik.com", UserRole.Organizer, 180, "Rıhtım Etkinlik");
        var basket = U("Tolga Er", "basketligi", "bilet@istanbulbasket.org", UserRole.Organizer, 260, "İstanbul Basket Ligi");
        var kasif = U("Nil Toprak", "kucukkasifler", "merhaba@kucukkasifler.com", UserRole.Organizer, 150, "Küçük Kaşifler");
        var kare = U("Ozan Tan", "karekolektif", "kare@karekolektif.com", UserRole.Organizer, 120, "Kare Kolektif");
        var isik = U("IT & MIS Kulübü", "isikitmis", "itmis@isikun.edu.tr", UserRole.Organizer, 90, "Işık Üniversitesi IT & MIS Kulübü");

        db.Users.AddRange(elif, mert, can, selin, burak, defne, emre, ayse, zeynep, kaan, mavi, moda, techist, rihtim, basket, kasif, kare, isik);

        // Next New Year's Eve that is at least a week away.
        var nye = new DateTime(today.Year, 12, 31);
        if (nye < today.AddDays(7)) nye = nye.AddYears(1);

        Event E(int cover, string title, string cat, string venue, string district, DateTime day, string time, string doors, int price, int left, int cap, User org, string age, string desc, string tags)
        {
            var start = day.Add(TimeSpan.Parse(time));
            var ev = new Event
            {
                Title = title, Category = cat, Venue = venue, District = district, StartsAt = start, DoorsAt = day.Add(TimeSpan.Parse(doors)),
                AgeLimit = age, Description = desc, Tags = tags, CoverImage = $"/img/covers/{cover}.jpg", Organizer = org,
                Status = EventStatus.Published, CreatedAt = today.AddDays(-30)
            };
            // Same three tiers as the prototype; seats already sold elsewhere are counted in Sold.
            int R(double n, int step) => (int)(Math.Round(n / step) * step);
            (string name, string desc, int price, int cap, int left)[] tiers =
            [
                ("Tam", "Genel giriş", price, (int)(cap * .7), left),
                ("Öğrenci", "Girişte öğrenci kimliği istenir", R(price * .65, 10), (int)(cap * .2), (int)Math.Round(left * .4)),
                ("VIP", "Ön bölüm ve ayrı giriş", R(price * 2.2, 50), Math.Max(2, (int)(cap * .1)), cover is 1 or 11 ? 0 : Math.Max(2, (int)Math.Round(left * .08))),
            ];
            int i = 0;
            foreach (var t in tiers)
            {
                var capacity = Math.Max(t.cap, t.left);
                ev.Tiers.Add(new TicketTier { Name = t.name, Description = t.desc, Price = t.price, Capacity = capacity, Sold = capacity - t.left, SortOrder = i++ });
            }
            return ev;
        }

        var D = (int d) => today.AddDays(d);
        var events = new[]
        {
            E(1, "Boğaz Elektronik Gecesi", "Konser", "KüçükÇiftlik Park", "Maçka", D(4), "22:00", "21:00", 650, 38, 4000, mert, "+18",
              "Şehrin en uzun gecesi Maçka'da. Üç sahnede dokuz DJ, gün doğumuna kadar süren bir set ve Boğaz manzaralı açık hava bar. Yağmur ihtimaline karşı ana sahne kapalı alanda kuruluyor.", "#Elektronik #DJ #Gece"),
            E(2, "Gece Yarısı Caz Seansları", "Konser", "Salon İKSV", "Şişhane", D(6), "21:30", "20:45", 420, 120, 450, mavi, "+16",
              "Kuartet formatında iki set: ilki standartlar, ikincisi grubun yeni albümünden parçalar. Masa düzeninde oturmalı konser.", "#Caz #CanlıMüzik #Kuartet"),
            E(3, "Bir Garip Pazartesi", "Komedi", "Maximum Uniq Hall", "Maslak", D(8), "20:30", "19:45", 380, 210, 1200, burak, "+16",
              "Haftanın en sevilmeyen gününe 90 dakikalık bir intikam. Üç yeni stand-up komedyeni, bir sürpriz konuk.", "#StandUp #Komedi"),
            E(4, "Hamlet: Yeniden", "Tiyatro", "Moda Sahnesi", "Kadıköy", D(10), "20:00", "19:30", 300, 12, 280, moda, "+12",
              "Shakespeare'in klasiği, bugünün İstanbul'unda geçen yalın bir yorumla. Dört oyuncu, tek dekor, iki perde.", "#Tiyatro #Shakespeare"),
            E(5, "İstanbul Yapay Zekâ Zirvesi", "Konferans", "Haliç Kongre Merkezi", "Beyoğlu", D(12), "10:00", "09:00", 900, 340, 1500, techist, "Herkes",
              "Araştırmacılar, girişimciler ve öğrenciler için tam gün program: ana oturumlar, atölyeler ve bir kariyer fuarı. Öğle yemeği bilete dahil.", "#YapayZekâ #Teknoloji #Kariyer"),
            E(6, "Kadıköy Sokak Lezzetleri", "Festival", "Kadıköy Rıhtım", "Kadıköy", D(14), "12:00", "12:00", 150, 800, 5000, rihtim, "Herkes",
              "Kırk tezgâh, sekiz canlı performans ve gün batımında rıhtımda bir DJ seti. Bilet, üç tadım kuponu içerir.", "#Festival #Yemek #AçıkHava"),
            E(7, "Senfonik Film Müzikleri", "Klasik", "Zorlu PSM", "Beşiktaş", D(17), "20:00", "19:15", 550, 64, 2100, mert, "+7",
              "80 kişilik orkestra ve koro, sinema tarihinin en bilinen temalarını dev ekran eşliğinde çalıyor.", "#Orkestra #Film #Klasik"),
            E(8, "Derbi Gecesi: Basketbol", "Spor", "Sinan Erdem Spor Salonu", "Bakırköy", D(20), "19:00", "17:30", 480, 1500, 16000, basket, "Herkes",
              "Sezonun en çok beklenen maçı. Kapılar maçtan 90 dakika önce açılıyor; tribün renklerine göre giriş kapıları farklı.", "#Basketbol #Derbi"),
            E(9, "Kuzey Rüzgârı Akustik", "Konser", "Bostancı Gösteri Merkezi", "Kadıköy", D(23), "21:00", "20:00", 400, 290, 3500, mavi, "+12",
              "Grubun ilk akustik turnesinin İstanbul durağı. Yaylı dörtlü eşliğinde yeniden düzenlenmiş şarkılar.", "#Akustik #Rock #CanlıMüzik"),
            E(10, "Uzay Atölyesi: Çocuklar İçin Bilim", "Aile", "Maslak Bilim Merkezi", "Sarıyer", D(27), "11:00", "10:30", 200, 44, 120, kasif, "7–12 yaş",
              "Roket yapımı, planetaryum gösterisi ve bir astronotla soru-cevap. Her çocuk bir ebeveynle katılır; ebeveyn bileti ücretsiz.", "#Aile #Bilim #Uzay"),
            E(11, "Gece Fotoğrafçılığı Atölyesi", "Atölye", "Galata Rıhtımı", "Karaköy", D(32), "19:00", "18:45", 750, 8, 20, kare, "+16",
              "Uzun pozlama, ışık izleri ve şehir ışıkları. Tripod ve manuel ayar yapılabilen bir fotoğraf makinesi gerekiyor.", "#Fotoğraf #Atölye"),
            E(12, "Yılbaşı Gala Konseri", "Klasik", "Cemal Reşit Rey", "Harbiye", nye, "21:00", "20:15", 1200, 150, 860, mert, "+7",
              "Strauss valsleri, opera aryaları ve gece yarısı geri sayımı. Gala sonrası fuayede kutlama.", "#Gala #Yılbaşı #Klasik"),
            // Past events for ticket history.
            E(9, "Sonbahar Akustik", "Konser", "Moda Sahnesi", "Kadıköy", D(-42), "20:30", "19:45", 280, 0, 280, moda, "+12",
              "Moda Sahnesi'nde akustik bir sonbahar akşamı.", "#Akustik"),
            E(7, "Kampüs Film Gecesi", "Aile", "Işık Üniversitesi", "Sarıyer", D(-51), "19:00", "18:30", 60, 0, 200, isik, "Herkes",
              "Kampüste açık hava film gösterimi.", "#Film #Kampüs"),
        };
        db.Events.AddRange(events);
        await db.SaveChangesAsync();

        // Confirmed orders with real tickets (these seats are already part of Sold).
        Order O(User u, Event ev, string tier, int qty, int daysAgo, bool redeemed = false)
        {
            var t = ev.Tiers.First(x => x.Name == tier);
            var at = today.AddDays(-daysAgo).AddHours(14);
            var o = new Order
            {
                Code = Codes.OrderCode(), User = u, Event = ev, Status = OrderStatus.Confirmed, CreatedAt = at, PaidAt = at, CardLast4 = "4417",
                Items = { new OrderItem { TierId = t.Id, Quantity = qty, UnitPrice = t.Price } }, Total = qty * t.Price
            };
            for (int i = 0; i < qty; i++)
                o.Tickets.Add(new Ticket { TierId = t.Id, Code = Codes.TicketCode(), IssuedAt = at, Status = redeemed ? TicketStatus.Redeemed : TicketStatus.Issued, RedeemedAt = redeemed ? ev.DoorsAt.AddMinutes(12) : null });
            return o;
        }
        db.Orders.AddRange(
            O(elif, events[1], "Tam", 2, 9), O(elif, events[6], "Öğrenci", 1, 6), O(elif, events[11], "Tam", 2, 4),
            O(elif, events[12], "Tam", 2, 50, redeemed: true), O(elif, events[13], "Tam", 1, 60, redeemed: true),
            O(ayse, events[0], "Tam", 2, 3), O(kaan, events[0], "VIP", 1, 2), O(selin, events[6], "Tam", 3, 5),
            O(defne, events[11], "Öğrenci", 1, 1), O(ayse, events[6], "VIP", 2, 2));

        db.AuditLogs.AddRange(
            new AuditLog { ActorId = null, ActorName = "Zeynep Arslan", Action = "user.ban", Detail = "Emre Koç · Kalıcı · Sahte hesap", CreatedAt = today.AddDays(-40).AddHours(11) },
            new AuditLog { ActorId = null, ActorName = "Zeynep Arslan", Action = "user.ban", Detail = "Can Demir · 14 gün · Bilet karaborsası", CreatedAt = today.AddDays(-3).AddHours(16) });
        await db.SaveChangesAsync();

        // Point seeded audit entries at the admin now that ids exist.
        await db.AuditLogs.ExecuteUpdateAsync(s => s.SetProperty(a => a.ActorId, zeynep.Id));
    }
}
