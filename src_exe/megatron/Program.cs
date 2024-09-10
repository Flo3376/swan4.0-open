using System;
using System.Net.Sockets;
using System.Net;
using System.Threading.Tasks;
using System.IO;
using System.Web;

namespace megatron
{
    class Program
    {
        static void Main(string[] args)
        {
            // Création d'une instance du SoundManager
            SoundManager soundManager = new SoundManager();
            CommandPlayerManager commandPlayerManager = new CommandPlayerManager();
            CommandKeyManager commandKeyManager = new CommandKeyManager();

            int port = 2953;
            var listener = new TcpListener(IPAddress.Any, port);
            listener.Start();
            Console.WriteLine($"Server is listening on {IPAddress.Loopback}:{port}");

            try
            {
                while (true)
                {
                    TcpClient client = listener.AcceptTcpClient();
                    HandleClientAsync(client, commandPlayerManager, soundManager, commandKeyManager);
                }
            }
            finally
            {
                listener.Stop();
            }
        }

        static async Task HandleClientAsync(TcpClient client, CommandPlayerManager commandPlayerManager, SoundManager soundManager, CommandKeyManager commandKeyManager)
        {
            using (client)
            using (var stream = client.GetStream())
            using (var reader = new StreamReader(stream))
            using (var writer = new StreamWriter(stream))
            {
                writer.AutoFlush = true;

                // Récupérer l'adresse IP du client
                var clientIp = ((IPEndPoint)client.Client.RemoteEndPoint).Address;

                // Vérifier si l'adresse IP appartient à une plage privée ou localhost
                if (!IsLocalIpAddress(clientIp))
                {
                    Console.WriteLine($"Access denied for IP: {clientIp}");
                    await writer.WriteLineAsync("HTTP/1.1 403 Forbidden");
                    await writer.WriteLineAsync("Content-Type: text/plain");
                    await writer.WriteLineAsync("");
                    await writer.WriteLineAsync("Access denied.");
                    return;
                }

                string line;
                string requestLine = await reader.ReadLineAsync();

                // Vérifier si requestLine est null
                if (string.IsNullOrEmpty(requestLine))
                {
                    await writer.WriteLineAsync("HTTP/1.1 400 Bad Request");
                    await writer.WriteLineAsync("Content-Type: text/plain");
                    await writer.WriteLineAsync("");
                    await writer.WriteLineAsync("Invalid request");
                    return;
                }

                Console.WriteLine();
                Console.WriteLine($"Main : received command: {requestLine} from IP: {clientIp}");
                Console.WriteLine();
                var url = requestLine.Split(' ')[1];
                var uri = new Uri("http://dummy" + url); // Utilisé pour parsing d'URI valide
                var query = HttpUtility.ParseQueryString(uri.Query);

                if (requestLine.StartsWith("GET") && requestLine.Contains("class_action=sound")) commandPlayerManager.player_command(url);
                if (requestLine.StartsWith("GET") && requestLine.Contains("class_action=keysender")) commandKeyManager.key_command(url);

                // Ajouter les en-têtes CORS ici
                await writer.WriteLineAsync("HTTP/1.1 200 OK");
                await writer.WriteLineAsync("Content-Type: text/plain");
                await writer.WriteLineAsync("Access-Control-Allow-Origin: *");  // Modifier si nécessaire
                await writer.WriteLineAsync("Access-Control-Allow-Methods: GET, POST, OPTIONS");
                await writer.WriteLineAsync("Access-Control-Allow-Headers: Content-Type");
                await writer.WriteLineAsync("");
                await writer.WriteLineAsync("ok");

                while ((line = await reader.ReadLineAsync()) != null && line != string.Empty)
                {
                    // Ignorer les en-têtes supplémentaires
                }
            }
        }

        // Méthode pour vérifier si l'IP est locale (localhost ou réseau local)
        static bool IsLocalIpAddress(IPAddress ipAddress)
        {
            // Vérifier si l'adresse est 127.0.0.1 (localhost)
            if (IPAddress.IsLoopback(ipAddress))
                return true;

            // Vérifier si l'adresse est dans une plage privée
            var bytes = ipAddress.GetAddressBytes();
            if (bytes[0] == 10 ||
                (bytes[0] == 172 && (bytes[1] >= 16 && bytes[1] <= 31)) ||
                (bytes[0] == 192 && bytes[1] == 168))
            {
                return true;
            }

            return false;
        }
    }
}
