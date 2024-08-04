using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Globalization;
using System.Xml.XPath;


using System.Speech;
using System.Speech.Recognition;
using System.Speech.AudioFormat;
using static System.Net.Mime.MediaTypeNames;


namespace net.encausse.sarah {
    class SpeechEngine : IDisposable {

        CultureInfo culture = CultureInfo.CreateSpecificCulture("en-US");

        // -------------------------------------------
        //  CONSTRUCTOR
        // ------------------------------------------

        public SpeechRecognitionEngine Engine { get; set; }
        public String Name { get; set; }
        public double Confidence { get; set; }

        public SpeechEngine(String name, String recoId, String language, double confidence) {
            this.Name = name;
            this.Confidence = confidence; 

            var recoInfo = findReconizerInfo(recoId, language, false);
            if (recoInfo == null) { Log("No recognizer found..."); }
            this.Engine  = new SpeechRecognitionEngine(recoInfo);

            var info = this.Engine.RecognizerInfo;
            //Log("Using Recognizer Id: " + info.Id + " Name: " + info.Name + " Culture: " + info.Culture + " Kinect: " + info.AdditionalInfo.ContainsKey("Kinect"));
            Log("Using Recognizer Id: " + info.Id + " Name: " + info.Name + " Culture: " + info.Culture);
        }

        private RecognizerInfo findReconizerInfo(String recoId, String language, bool findKinect) {
            RecognizerInfo info = null;
            try {
                var recognizers = SpeechRecognitionEngine.InstalledRecognizers();

                foreach (var recInfo in recognizers) {

                    if (!language.Equals(recInfo.Culture.Name, StringComparison.OrdinalIgnoreCase))
                        continue;
                    if (!String.IsNullOrEmpty(recoId) && recoId.Equals(recInfo.Id, StringComparison.OrdinalIgnoreCase))
                        continue;
                    info = recInfo;
                }
            }
            catch (COMException) { }
            return info;
        }

        public void Init() {
            Init(2, 0, 0, 0.150, 0.500, false);
        }

        public void Init(int maxAlternate, double initialSilenceTimeout, double babbleTimeout, double endSilenceTimeout, double endSilenceTimeoutAmbiguous, bool adaptation) {

            Log("Init recognizer");

            Engine.SpeechRecognized          += new EventHandler<SpeechRecognizedEventArgs>(recognizer_SpeechRecognized);
            Engine.RecognizeCompleted        += new EventHandler<RecognizeCompletedEventArgs>(recognizer_RecognizeCompleted);
            Engine.AudioStateChanged         += new EventHandler<AudioStateChangedEventArgs>(recognizer_AudioStateChanged);
            Engine.SpeechHypothesized        += new EventHandler<SpeechHypothesizedEventArgs>(recognizer_SpeechHypothesized);
            Engine.SpeechDetected            += new EventHandler<SpeechDetectedEventArgs>(recognizer_SpeechDetected);
            Engine.SpeechRecognitionRejected += new EventHandler<SpeechRecognitionRejectedEventArgs>(recognizer_SpeechRecognitionRejected);

            // http://msdn.microsoft.com/en-us/library/microsoft.speech.recognition.speechrecognitionengine.updaterecognizersetting(v=office.14).aspx
            Engine.UpdateRecognizerSetting("CFGConfidenceRejectionThreshold", (int) (this.Confidence * 100));

            Engine.MaxAlternates              = maxAlternate;
            Engine.InitialSilenceTimeout      = TimeSpan.FromSeconds(initialSilenceTimeout);
            Engine.BabbleTimeout              = TimeSpan.FromSeconds(babbleTimeout);
            Engine.EndSilenceTimeout          = TimeSpan.FromSeconds(endSilenceTimeout);
            Engine.EndSilenceTimeoutAmbiguous = TimeSpan.FromSeconds(endSilenceTimeoutAmbiguous);

            // For long recognition sessions (a few hours or more), it may be beneficial to turn off adaptation of the acoustic model. 
            // This will prevent recognition accuracy from degrading over time.
            if (!adaptation) {
                Engine.UpdateRecognizerSetting("AdaptationOn", 0);
                Engine.UpdateRecognizerSetting("PersistedBackgroundAdaptation", 0);
            }

            //Log("AudioLevel: "                 + Engine.AudioLevel);
            //Log("MaxAlternates: "              + Engine.MaxAlternates);
            //Log("BabbleTimeout: "              + Engine.BabbleTimeout);
            //Log("InitialSilenceTimeout: "      + Engine.InitialSilenceTimeout);
            //Log("EndSilenceTimeout: "          + Engine.EndSilenceTimeout);
            //Log("EndSilenceTimeoutAmbiguous: " + Engine.EndSilenceTimeoutAmbiguous);

            //try { Log("ResourceUsage: "                 + Engine.QueryRecognizerSetting("ResourceUsage")); }                 catch (Exception) { }
            //try { Log("ResponseSpeed: "                 + Engine.QueryRecognizerSetting("ResponseSpeed")); }                 catch (Exception) { }
            //try { Log("ComplexResponseSpeed: "          + Engine.QueryRecognizerSetting("ComplexResponseSpeed")); }          catch (Exception) { }
            //try { Log("AdaptationOn: "                  + Engine.QueryRecognizerSetting("AdaptationOn")); }                  catch (Exception) { }
            //try { Log("PersistedBackgroundAdaptation: " + Engine.QueryRecognizerSetting("PersistedBackgroundAdaptation")); } catch (Exception) { }
        }

        public void SetInputToAudioStream(Stream audioSource, SpeechAudioFormatInfo audioFormat) {
            this.Engine.SetInputToAudioStream(audioSource, audioFormat);
        }

        // -------------------------------------------
        //  INTERFACE
        // ------------------------------------------

        private bool LoadAndStarted = false;
        public void Start() {
            try {
                Pause(false);
                Log("Start listening...");
                LoadAndStarted = true;
            }
            catch (Exception ex) {
                Log("No device found");
                Log("Exception:\n" + ex.StackTrace);
            }
        }

        public void Stop(bool dispose) {
            Pause(true);
            if (dispose) { Engine.Dispose(); }
            Log("Stop listening...done");
        }

        public void Dispose() {
            Log("Dispose engine...");
        }

        private static int STATUS_INIT  = 0;
        private static int STATUS_START = 1;
        private static int STATUS_STOP  = 2;
        private int status = 0;
        public void Pause(bool state) {
            Log("Pause listening... " + Name + " => " + state + " / " + status);

            if (state && (status == STATUS_START || status == STATUS_INIT)) {
                Engine.RecognizeAsyncStop();
                status = STATUS_STOP;
            } else if (!state && (status == STATUS_STOP || status == STATUS_INIT)) {
                Engine.RecognizeAsync(RecognizeMode.Multiple);
                status = STATUS_START;
            }
        }

        // -------------------------------------------
        //  GRAMMAR
        // ------------------------------------------

        private DateTime loading = DateTime.MinValue;
        public void Load(IDictionary<string, SpeechGrammar> cache, bool reload) {
            if (reload && Name.Equals("FileSystem")) { return; }
            Log("Loading grammar cache");
            foreach (SpeechGrammar g in cache.Values) {
                if (g.LastModified < loading) { continue; }
                Load(g.Name, g.Build());
            }
            loading = DateTime.Now;
        }

        public void Load(String name, Grammar grammar) {
            if (grammar == null) { Log("ByPass " + name + " wrong grammar"); return; }
            if ("FileSystem" == Name && LoadAndStarted) { Log("ByPass FileSystem Engine !!!"); return; }

            foreach (Grammar g in Engine.Grammars) {
                if (g.Name != name || !g.Loaded) { continue; }
                Log("Try to Unload Grammar to Engine: " + name);
                Engine.UnloadGrammar(g);
                Engine.RequestRecognizerUpdate();
                break;
            }

            Log("Load Grammar to Engine: " + name);
            Engine.LoadGrammar(grammar);

        }

        
        // -------------------------------------------
        //  UTILITY
        // ------------------------------------------

        protected void Log(string msg) {
            Console.Error.WriteLine(msg);
            //System.Diagnostics.Debug.WriteLine(msg);
        }

        // Méthode pour obtenir le répertoire de sortie pour les fichiers .wav
        private string GetOutputDirectory()
        {
            string baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
            DirectoryInfo dirInfo = new DirectoryInfo(baseDirectory);
            for (int i = 0; i < 3; i++)
            {
                if (dirInfo.Parent != null)
                    dirInfo = dirInfo.Parent;
            }
            string outputDirectory = Path.Combine(dirInfo.FullName, "sound", "input_listen_sound");
            Directory.CreateDirectory(outputDirectory); // S'assure que le répertoire existe
            return outputDirectory;
        }

        // -------------------------------------------
        //  CALLBACKS
        // ------------------------------------------

        protected void recognizer_SpeechRecognized(object sender, SpeechRecognizedEventArgs e) {
            SpeechRecognized(e.Result);
        }
        protected void recognizer_RecognizeCompleted(object sender, RecognizeCompletedEventArgs e) {
            String resultText = e.Result != null ? e.Result.Text : "<null>";
            Log("RecognizeCompleted (" + DateTime.Now.ToString("mm:ss.f") + "): " + resultText);
            Log("BabbleTimeout: " + e.BabbleTimeout + "; InitialSilenceTimeout: " + e.InitialSilenceTimeout + "; Result text: " + resultText);
        }
        protected void recognizer_AudioStateChanged(object sender, AudioStateChangedEventArgs e) {
            Log("AudioStateChanged (" + DateTime.Now.ToString("mm:ss.f") + "):" + e.AudioState);
        }
        protected void recognizer_SpeechHypothesized(object sender, SpeechHypothesizedEventArgs e) {
            Log("recognizer_SpeechHypothesized " + e.Result.Text + " => " + e.Result.Confidence);
        }
        protected void recognizer_SpeechDetected(object sender, SpeechDetectedEventArgs e) {
            Log("recognizer_SpeechDetected");
        }
        protected void recognizer_SpeechRecognitionRejected(object sender, SpeechRecognitionRejectedEventArgs e)
        {
            // Log the rejection
            //Log("Recognition rejected. Attempting to save audio data...");

            // Check if the RecognitionResult is available
            if (e.Result != null)
            {
                //Log("Confidence of rejected result: " + e.Result.Confidence);

                var timestamp = DateTime.Now.ToString("MM_dd_HH_mm_ss");
                string filename = Path.Combine(GetOutputDirectory(), $"rejected_{timestamp}.wav");


                Console.Write("<JSON>");

                // Write the audio to a file
                using (var stream = new MemoryStream())
                {
                    e.Result.Audio.WriteToWaveStream(stream);
                    stream.Position = 0; // Reset stream position to beginning after writing
                    File.WriteAllBytes(filename, stream.ToArray()); // Save the stream to a file
                }
                string conf = "\"confidence\": " + e.Result.Confidence.ToString(culture).Replace(",", ".") + ", ";
                string file = "\"filename\": \"" + filename.Replace("\\", "\\\\") + "\"";  // Double les antislashs
                string json = "{" + conf + file + "}";
                Console.Write(json);
                Console.Write("</JSON>");
               // Log("Audio data saved to: " + filename);
            }
            else
            {
                Log("No audio data available for rejected recognition.");
            }
        }

        // -------------------------------------------
        //  HANDLER
        // ------------------------------------------

        private bool IsWorking = false;
        protected void SpeechRecognized(RecognitionResult rr) {

            // 1. Handle the Working local state
            if (IsWorking) {
                Log("REJECTED Speech while working: " + rr.Confidence + " Text: " + rr.Text);
                return;
            }

            // 2. Start
            IsWorking = true;
            var start = DateTime.Now;

            // 3. Handle Results
            try {
                SpeechRecognizedCallback(this, rr);
            }
            catch (Exception ex) {
                Log("Exception:\n" + ex.StackTrace);
            }

            // 4. End
            IsWorking = false;
            Log("SpeechRecognized: " + (DateTime.Now - start).TotalMilliseconds + "ms Text: " + rr.Text);
        }


        public bool IsListening = true;

        // Fonction pour nettoyer les noms de fichiers
        private string CleanFileName(string fileName)
        {
            // Supprimer les caractères interdits
            foreach (char c in Path.GetInvalidFileNameChars())
            {
                fileName = fileName.Replace(c.ToString(), "");
            }

            // Remplacer les espaces et les apostrophes par des underscores
            fileName = fileName.Replace(' ', '_').Replace('\'', '_');

            // Supprimer les underscores consécutifs en utilisant une expression régulière
            fileName = System.Text.RegularExpressions.Regex.Replace(fileName, "_{2,}", "_");

            // Supprimer un underscore final, si présent
            if (fileName.EndsWith("_"))
            {
                fileName = fileName.TrimEnd('_');
            }

            return fileName;
        }


        protected void SpeechRecognizedCallback(SpeechEngine engine, RecognitionResult rr)
        {
            // 1. Handle the Listening global state
            if (!IsListening)
            {
                Log("REJECTED not listening");
                return;
            }

            // 2. Compute XPath Navigator
            var text = rr.Text;
            Console.Write("<JSON>");
            using (var stream = new MemoryStream())
            {
                rr.Audio.WriteToWaveStream(stream);
                stream.Position = 0;

                // Nettoyer le texte reconnu pour qu'il soit utilisable dans un nom de fichier
                string recognizedText = CleanFileName(rr.Text);

                string baseFilename = Path.Combine(GetOutputDirectory(), $"Recognized_{recognizedText}");
                string filename = baseFilename + ".wav";

                // Incrémenter le nom du fichier s'il existe déjà
                int counter = 1;
                while (File.Exists(filename))
                {
                    filename = $"{baseFilename}_{counter++}.wav";
                }


                // 5. Save the stream to a file
                using (FileStream fileStream = new FileStream(filename, FileMode.Create, FileAccess.Write))
                {
                    stream.CopyTo(fileStream);
                }

                // 6. Construct JSON
                XPathNavigator xnav = rr.ConstructSmlFromSemantics().CreateNavigator();
                var nav = xnav.Select("/SML/action/*");

                string opts = "";
                if (nav.Count > 0)
                {
                    opts = "\"options\": {" + Options(nav) + "}, ";
                }

                string txt = "\"text\": \"" + rr.Text.Replace("\"", "\\\"").ToString(culture) + "\", ";
                string conf = "\"confidence\": " + rr.Confidence.ToString(culture).Replace(",", ".") + ", ";
                string file = "\"filename\": \"" + filename.Replace("\\", "\\\\") + "\"";  // Double les antislashs

                string json = "{" + txt + conf + opts + file + "}";
                Console.Write(json);
            }
            Console.Write("</JSON>");
        }

        protected String Options(XPathNodeIterator it) {
            String json = "";
            while (it.MoveNext()) {

                if (it.Current.Name == "confidence")
                    continue;

                if (it.Current.Name == "uri")
                    continue;

                if (it.Current.HasChildren) {
                    
                    var content = Options(it.Current.SelectChildren(String.Empty, it.Current.NamespaceURI));
                    json += "\"" + it.Current.Name + "\" : \"" + content + "\", ";
                }
            }
            return json.Equals("") ? it.Current.Value : json.Substring(0, json.Length-2);
        }
    }
}