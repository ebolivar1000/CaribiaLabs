Add-Type -AssemblyName System.Speech

$voiceName = "Microsoft Helena Desktop"
$outDir = "D:\ProyectosIA\caribia-labs-site\instagram\reels\reel_01_cuaderno_vs_crm\audio"

function Export-VoiceLine($text, $filename) {
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.SelectVoice($voiceName)
    $synth.Rate = 1 # slightly faster pace for Instagram Reel
    $synth.Volume = 100
    $filePath = Join-Path $outDir $filename
    $synth.SetOutputToWaveFile($filePath)
    $synth.Speak($text)
    $synth.Dispose()
    Write-Host "Generated: $filePath"
}

Export-VoiceLine "¿Sigues anotando tus ventas y gastos a mano en un cuaderno?" "line1_cuaderno.wav"
Export-VoiceLine "Automatiza tu negocio con un CRM moderno que gestiona toda tu facturación y métricas en un solo clic." "line2_crm.wav"
Export-VoiceLine "CaribIA Labs: la entrega personalizada más rápida del mercado. Escribe CRM o entra al link de la bio." "line3_cta.wav"
