using Gise.Web.Data;
using Gise.Web.Infrastructure;
using Gise.Web.Models;
using Gise.Web.Services;
using Gise.Web.ViewModels;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gise.Web.Controllers;

public class AccountController(GiseDbContext db, IClock clock, AuditService audit, ILogger<AccountController> log) : Controller
{
    [HttpGet("/giris")]
    public IActionResult Login(string? returnUrl)
    {
        if (User.IsSignedIn()) return LocalRedirect(SafeReturn(returnUrl));
        return View(new LoginVm { ReturnUrl = returnUrl });
    }

    [HttpPost("/giris")]
    public async Task<IActionResult> Login(LoginVm vm)
    {
        if (!ModelState.IsValid) return View(vm);

        var login = vm.Login.Trim();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == login || u.Username == login.TrimStart('@'));
        if (user is null || !Passwords.Verify(vm.Password, user.PasswordHash))
        {
            ModelState.AddModelError("", "E-posta/kullanıcı adı veya şifre hatalı.");
            return View(vm);
        }
        if (user.IsBanned(clock.Now))
        {
            var until = user.BannedUntil is { } u ? $"{u:dd.MM.yyyy} tarihine kadar" : "kalıcı olarak";
            ModelState.AddModelError("", $"Hesabın {until} askıya alındı ({user.BanReason}).");
            return View(vm);
        }

        await SignInAsync(user, vm.RememberMe);
        log.LogInformation("User {UserId} signed in", user.Id);
        TempData["Toast"] = $"Hoş geldin, {user.FullName.Split(' ')[0]}!";
        var fallback = user.Role == UserRole.Admin ? "/yonetim" : "/";
        return LocalRedirect(string.IsNullOrEmpty(vm.ReturnUrl) ? fallback : SafeReturn(vm.ReturnUrl));
    }

    [HttpGet("/kayit")]
    public IActionResult Register(string? returnUrl, string? tur)
    {
        if (User.IsSignedIn()) return LocalRedirect("/");
        return View(new RegisterVm { ReturnUrl = returnUrl, AccountType = tur == "organizator" ? UserRole.Organizer : UserRole.Attendee });
    }

    [HttpPost("/kayit")]
    public async Task<IActionResult> Register(RegisterVm vm)
    {
        if (ModelState.IsValid)
        {
            var email = vm.Email.Trim();
            var username = vm.Username.Trim();
            if (await db.Users.AnyAsync(u => u.Email == email)) ModelState.AddModelError(nameof(vm.Email), "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.");
            if (await db.Users.AnyAsync(u => u.Username == username)) ModelState.AddModelError(nameof(vm.Username), $"@{username} alınmış; başka bir kullanıcı adı dene.");
        }
        if (!ModelState.IsValid) return View(vm);

        var user = new User
        {
            FullName = vm.FullName.Trim(), Username = vm.Username.Trim(), Email = vm.Email.Trim(),
            PasswordHash = Passwords.Hash(vm.Password), Role = vm.AccountType,
            OrganizationName = vm.AccountType == UserRole.Organizer ? vm.OrganizationName!.Trim() : null,
            CreatedAt = clock.Now
        };
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            // Unique index race: someone took the same username/e-mail a moment earlier.
            log.LogWarning(ex, "Register conflict for {Username}", user.Username);
            ModelState.AddModelError("", "Bu kullanıcı adı veya e-posta az önce alındı. Başka bir tane dene.");
            return View(vm);
        }
        audit.Log(user.Id, user.FullName, "user.register", $"@{user.Username} · {Roles.Label(user.Role)}");
        await db.SaveChangesAsync();

        await SignInAsync(user, true);
        TempData["Toast"] = $"Hesabın oluşturuldu. Hoş geldin, {user.FullName.Split(' ')[0]}!";
        return LocalRedirect(SafeReturn(vm.ReturnUrl));
    }

    [HttpPost("/cikis")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        TempData["Toast"] = "Çıkış yaptın.";
        return LocalRedirect("/");
    }

    [Authorize, HttpGet("/ayarlar")]
    public async Task<IActionResult> Settings()
    {
        var me = await db.Users.FindAsync(User.Id());
        if (me is null) return Challenge();
        ViewData["Title"] = "Hesap Ayarları";
        ViewData["Nav"] = "profil";
        return View(me);
    }

    private Task SignInAsync(User user, bool persistent) =>
        HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, user.ToPrincipal(),
            new AuthenticationProperties { IsPersistent = persistent, AllowRefresh = true });

    private string SafeReturn(string? url) => !string.IsNullOrEmpty(url) && Url.IsLocalUrl(url) ? url : "/";
}
