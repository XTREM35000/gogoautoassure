# Configuration
$projectUrl = "https://gezrcuwrspltcjdeswcp.supabase.co"
$functionName = "reset-db"

# Headers - make sure these are correct
$headers = @{
  "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlenJjdXdyc3BsdGNqZGVzd2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzgxNjEsImV4cCI6MjA2NDUxNDE2MX0.KL2FIooh9U-SYbdPKdIabz53UkQlF9Cg9lFFWvu2ecE"
  "Authorization" = "Bearer YOUR_SERVICE_ROLE_KEY_HERE"  # Replace this!
  "Content-Type" = "application/json"
}

$url = "$projectUrl/functions/v1/$functionName"

try {
    # Add verbose output for debugging
    Write-Host "Attempting to call function at: $url"

    $body = @{} | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -Verbose
    Write-Host "SUCCESS - Function response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host
}
catch {
    Write-Host "ERROR DETAILS:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Status Description: $($_.Exception.Response.StatusDescription)"

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $errorDetails = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $errorDetails
    }

    Write-Host "Full Error:" -ForegroundColor Red
    Write-Host $_
}
