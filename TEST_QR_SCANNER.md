# Testing QR Scanner Feature

## Prerequisites

✅ Android device (camera doesn't work in emulator)
✅ Camera permissions enabled
✅ Restaurant QR code to scan

## Build & Install

### Option 1: Quick Build
```bash
build-with-qr-scanner.bat
```

### Option 2: Manual Build
```bash
cd client
npm install
npm run build
npx cap sync android
cd android
gradlew assembleDebug
```

### Install APK
Transfer and install: `client/android/app/build/outputs/apk/debug/app-debug.apk`

## Testing Steps

### Test 1: Home Page Scanner
1. Open the app
2. Look for the scan icon (📷) next to the search bar
3. Tap the scan icon
4. Grant camera permission if prompted
5. Point camera at restaurant QR code
6. Verify it automatically navigates to menu

### Test 2: Bottom Nav Scanner
1. Open the app
2. Look at the bottom navigation bar
3. Tap the "Scan" button (middle button)
4. Point camera at restaurant QR code
5. Verify it automatically navigates to menu

### Test 3: Invalid QR Code
1. Open scanner
2. Scan a non-restaurant QR code (any other QR)
3. Verify error message appears: "Invalid QR code"
4. Error should disappear after 3 seconds
5. Scanner should remain active

### Test 4: Camera Permission Denied
1. Go to Android Settings > Apps > WaitNot > Permissions
2. Deny camera permission
3. Open app and tap scan button
4. Verify error message: "Camera access denied"
5. Grant permission and try again

### Test 5: Close Scanner
1. Open scanner
2. Tap the X button (top right)
3. Verify scanner closes properly
4. Verify camera stops (no green indicator)

## Expected QR Code Format

The scanner expects URLs in this format:
```
https://yourapp.com/qr/{restaurantId}/{tableNumber}
```

Examples:
- `https://waitnot.com/qr/abc123/5`
- `https://yourapp.com/qr/rest456/12`
- `http://localhost:5173/qr/789xyz/3`

## Visual Indicators

### Scanning Active:
- Camera view visible
- Red corner decorations
- Animated scanning line moving up/down
- "Position the QR code within the frame" message

### Successful Scan:
- Scanner closes
- Navigates to restaurant menu page
- Shows table number in URL

### Error State:
- Red error box at bottom
- Error message displayed
- Scanner remains active

## Troubleshooting

### Camera Not Working
- Check if camera permission is granted
- Restart the app
- Try on a different device
- Ensure you're testing on real device (not emulator)

### QR Code Not Detected
- Ensure good lighting
- Hold phone steady
- Keep QR code within the frame
- Try moving closer/farther from QR code
- Ensure QR code is not damaged or blurry

### Scanner Freezes
- Close and reopen scanner
- Restart the app
- Check if other apps can use camera

### Wrong Page After Scan
- Verify QR code contains correct URL format
- Check console logs for errors
- Ensure restaurant ID exists in database

## Performance Notes

- Scanner uses 10 FPS for battery efficiency
- Automatic rear camera selection
- Proper cleanup when closing scanner
- No memory leaks

## Camera Permissions

The app requests camera permission when:
1. First time opening scanner
2. After permission was denied and re-enabled

Permission is required for:
- Accessing device camera
- Reading QR codes
- Auto-focus functionality

## Next Steps After Testing

If everything works:
1. ✅ Scanner opens from both locations
2. ✅ Camera permission works
3. ✅ QR codes are detected
4. ✅ Navigation works correctly
5. ✅ Error handling works

Then you can:
- Generate QR codes for your restaurants
- Print QR codes for tables
- Train staff on the feature
- Deploy to production
