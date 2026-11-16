Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $speak.GetInstalledVoices()
foreach ($v in $voices) {
    [Console]::WriteLine($v.VoiceInfo.Name + " | " + $v.VoiceInfo.Culture.Name)
}
