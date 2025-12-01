$file = "client/src/pages/RestaurantDashboard.jsx"
$content = Get-Content $file -Raw

# Update all bg-white to include dark mode
$content = $content -replace 'className="bg-white rounded-lg shadow-md', 'className="bg-white dark:bg-gray-800 rounded-lg shadow-md'
$content = $content -replace 'className="bg-white rounded-lg', 'className="bg-white dark:bg-gray-800 rounded-lg'
$content = $content -replace 'text-gray-800"', 'text-gray-800 dark:text-white"'
$content = $content -replace 'text-gray-600"', 'text-gray-600 dark:text-gray-400"'
$content = $content -replace 'text-gray-700"', 'text-gray-700 dark:text-gray-300"'
$content = $content -replace 'text-gray-500"', 'text-gray-500 dark:text-gray-400"'

Set-Content $file $content
Write-Host "Dark mode classes updated successfully!"
