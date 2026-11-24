// Ventana nativa (WebView2) que muestra ruta-escalado.html desde la carpeta del .exe.
// No toca el juego: solo es una ventana con la herramienta manual.
// Avisos: la página manda sus temporizadores ({timers:[{id,due,text}]}) y la app avisa con Windows
// aunque la ventana esté minimizada (la página puede ir más lenta en segundo plano).
// Actualizaciones: la página avisa si hay una release más nueva en GitHub; si pulsas «Actualizar», la app descarga
// RobRunPlanner.zip de ESE repo (nunca de otra URL), se cierra, copia los archivos encima y se vuelve a abrir.
// Tus datos están en %LOCALAPPDATA%\RobRunPlanner y no se tocan.
using System.Diagnostics;
using System.IO.Compression;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

static class Program
{
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    static extern bool FlashWindowEx(ref FLASHWINFO info);
    struct FLASHWINFO { public uint cbSize; public IntPtr hwnd; public uint dwFlags, uCount, dwTimeout; }
    // Parpadea en la barra de tareas hasta que abras la ventana (FLASHW_ALL | FLASHW_TIMERNOFG)
    static void FlashWindow(IntPtr hwnd)
    {
        var info = new FLASHWINFO { hwnd = hwnd, dwFlags = 3 | 12 };
        info.cbSize = (uint)System.Runtime.InteropServices.Marshal.SizeOf(info);
        FlashWindowEx(ref info);
    }

    // Sonido del aviso: "aviso.wav" junto al .exe si existe (pon el que quieras); si no, una campanita generada.
    static System.Media.SoundPlayer player;
    static void PlayAlert()
    {
        try
        {
            var custom = Path.Combine(AppContext.BaseDirectory, "aviso.wav");
            player ??= File.Exists(custom) ? new System.Media.SoundPlayer(custom) : new System.Media.SoundPlayer(new MemoryStream(Chime()));
            player.Play(); // asíncrono, sale por el dispositivo de audio normal
        }
        catch { }
    }

    // Campanita: tres notas ascendentes, dos veces (~2 s), WAV 16-bit mono 44,1 kHz
    static byte[] Chime()
    {
        const int rate = 44100;
        var notes = new[] { 880.0, 1108.7, 1318.5 };
        var samples = new List<short>();
        for (var rep = 0; rep < 2; rep++)
        {
            foreach (var f in notes)
                for (var i = 0; i < rate * 0.22; i++)
                {
                    var t = (double)i / rate;
                    var env = Math.Min(1, t / 0.01) * Math.Exp(-t * 9); // ataque corto + caída
                    samples.Add((short)(Math.Sin(2 * Math.PI * f * t) * env * 0.6 * short.MaxValue));
                }
            samples.AddRange(new short[(int)(rate * 0.25)]);
        }
        var ms = new MemoryStream();
        var w = new BinaryWriter(ms);
        int bytes = samples.Count * 2;
        w.Write("RIFF"u8); w.Write(36 + bytes); w.Write("WAVE"u8);
        w.Write("fmt "u8); w.Write(16); w.Write((short)1); w.Write((short)1); w.Write(rate); w.Write(rate * 2); w.Write((short)2); w.Write((short)16);
        w.Write("data"u8); w.Write(bytes);
        foreach (var s in samples) w.Write(s);
        return ms.ToArray();
    }

    const string Repo = "daviddaco1/rob-run-planner";

    // Descarga la última release y deja preparado un script que la instala cuando se cierre la app.
    // Devuelve null si todo va bien o el motivo del fallo (en español, se muestra en la página).
    static async Task<string?> PrepareUpdate()
    {
        using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(5) };
        http.DefaultRequestHeaders.UserAgent.ParseAdd("RobRunPlanner-updater");
        using var doc = JsonDocument.Parse(await http.GetStringAsync($"https://api.github.com/repos/{Repo}/releases/latest"));
        var url = doc.RootElement.GetProperty("assets").EnumerateArray()
            .Where(a => a.GetProperty("name").GetString() == "RobRunPlanner.zip")
            .Select(a => a.GetProperty("browser_download_url").GetString()).FirstOrDefault();
        if (url is null || !url.StartsWith($"https://github.com/{Repo}/releases/download/", StringComparison.Ordinal))
            return "la versión nueva no incluye RobRunPlanner.zip.";
        var dir = AppContext.BaseDirectory.TrimEnd('\\');
        try { var probe = Path.Combine(dir, ".robrun-write-test"); File.WriteAllText(probe, ""); File.Delete(probe); }
        catch { return $"no se puede escribir en {dir}. Mueve la carpeta de la app a otro sitio o descarga la versión a mano."; }
        var tmp = Path.Combine(Path.GetTempPath(), "RobRunPlanner-update-" + Guid.NewGuid().ToString("N")[..8]);
        var zip = tmp + ".zip";
        await File.WriteAllBytesAsync(zip, await http.GetByteArrayAsync(url));
        ZipFile.ExtractToDirectory(zip, tmp); // lanza excepción si alguna entrada intenta salir de la carpeta
        if (!File.Exists(Path.Combine(tmp, "RobRunPlanner.exe")) || !File.Exists(Path.Combine(tmp, "ruta-escalado.html")))
            return "el paquete descargado está incompleto.";
        var pid = Environment.ProcessId;
        var cmd = Path.Combine(Path.GetTempPath(), "robrun-update.cmd");
        // Espera a que se cierre esta app, copia encima (los archivos que no vienen en el zip, como aviso.wav, se quedan) y la vuelve a abrir
        File.WriteAllText(cmd, $"""
@echo off
:wait
tasklist /FI "PID eq {pid}" /NH | find " {pid} " >nul && (timeout /t 1 /nobreak >nul & goto wait)
robocopy "{tmp}" "{dir}" /E /R:10 /W:1 >nul
start "" "{Path.Combine(dir, "RobRunPlanner.exe")}"
rd /s /q "{tmp}"
del "{zip}"
""");
        Process.Start(new ProcessStartInfo("cmd.exe", $"/c \"{cmd}\"") { CreateNoWindow = true, WindowStyle = ProcessWindowStyle.Hidden, UseShellExecute = false });
        return null;
    }

    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        var form = new Form { Text = "Rob Run Planner", Width = 620, Height = 960, StartPosition = FormStartPosition.CenterScreen };
        try { form.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        var web = new WebView2 { Dock = DockStyle.Fill };
        form.Controls.Add(web);

        // Icono en la bandeja: muestra los avisos y doble clic abre la ventana
        var tray = new NotifyIcon { Icon = form.Icon ?? SystemIcons.Application, Text = "Rob Run Planner", Visible = true };
        tray.DoubleClick += (_, _) => { form.Show(); form.WindowState = FormWindowState.Normal; form.Activate(); };
        tray.BalloonTipClicked += (_, _) => { form.Show(); form.WindowState = FormWindowState.Normal; form.Activate(); };
        form.FormClosed += (_, _) => tray.Dispose();

        var timers = new List<(string id, long due, string text)>();
        var notified = new HashSet<string>(); // id|due ya avisados en esta sesión
        var clock = new System.Windows.Forms.Timer { Interval = 1000 };
        clock.Tick += (_, _) =>
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var ready = timers.Where(t => t.due <= now && notified.Add($"{t.id}|{t.due}")).Select(t => t.text).ToList();
            if (ready.Count == 0) return;
            tray.ShowBalloonTip(15000, "Rob Run · producción lista", string.Join("\n", ready), ToolTipIcon.Info);
            // Solo para pruebas automáticas: registra cada aviso en el archivo que diga ROBRUN_TEST_LOG
            var log = Environment.GetEnvironmentVariable("ROBRUN_TEST_LOG");
            if (!string.IsNullOrEmpty(log)) try { File.AppendAllLines(log, ready); } catch { }
            // Windows oculta las notificaciones mientras juegas a pantalla completa: sonido + barra de tareas parpadeando
            PlayAlert();
            if (!form.ContainsFocus) FlashWindow(form.Handle);
        };
        clock.Start();

        form.Load += async (_, _) =>
        {
            // Datos (localStorage) en %LOCALAPPDATA%\RobRunPlanner, no junto al .exe.
            // ROBRUN_DATA_DIR permite usar otra carpeta (pruebas con perfil aislado, sin tocar tus datos).
            var data = Environment.GetEnvironmentVariable("ROBRUN_DATA_DIR") is { Length: > 0 } dir ? dir
                : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RobRunPlanner");
            var env = await CoreWebView2Environment.CreateAsync(null, data);
            await web.EnsureCoreWebView2Async(env);
            var core = web.CoreWebView2;
            core.SetVirtualHostNameToFolderMapping("robrun.app", AppContext.BaseDirectory, CoreWebView2HostResourceAccessKind.Allow);
            core.DocumentTitleChanged += (_, _) => { form.Text = core.DocumentTitle; tray.Text = core.DocumentTitle.Length > 63 ? core.DocumentTitle[..63] : core.DocumentTitle; };
            core.WebMessageReceived += async (_, e) =>
            {
                try
                {
                    using var doc = JsonDocument.Parse(e.WebMessageAsJson);
                    if (doc.RootElement.TryGetProperty("update", out JsonElement _))
                    {
                        string? err;
                        try { err = await PrepareUpdate(); } catch (Exception ex) { err = "no se pudo descargar (" + ex.Message + ")."; }
                        if (err is null) form.Close(); // el script instala y vuelve a abrir la app
                        else core.PostWebMessageAsJson(JsonSerializer.Serialize(new { updateError = err }));
                        return;
                    }
                    timers = doc.RootElement.GetProperty("timers").EnumerateArray()
                        .Select(t => (t.GetProperty("id").GetString(), t.GetProperty("due").GetInt64(), t.GetProperty("text").GetString()))
                        .ToList();
                }
                catch { }
            };
            // Enlaces externos (fuentes del catálogo) se abren en el navegador del sistema, no dentro de la app
            void OpenExternal(string url)
            {
                if (Uri.TryCreate(url, UriKind.Absolute, out var u) && (u.Scheme == "https" || u.Scheme == "http") && u.Host != "robrun.app")
                    try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(u.AbsoluteUri) { UseShellExecute = true }); } catch { }
            }
            core.NewWindowRequested += (_, e) => { e.Handled = true; OpenExternal(e.Uri); };
            core.NavigationStarting += (_, e) =>
            {
                if (Uri.TryCreate(e.Uri, UriKind.Absolute, out var u) && u.Host != "robrun.app" && u.Scheme != "blob" && u.Scheme != "data") { e.Cancel = true; OpenExternal(e.Uri); }
            };
            core.Navigate("https://robrun.app/ruta-escalado.html");
        };
        Application.Run(form);
    }
}
