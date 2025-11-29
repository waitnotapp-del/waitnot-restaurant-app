@echo off
echo ========================================
echo TESTING VOICE API - DETAILED
echo ========================================
echo.
echo Backend: Hugging Face
echo Endpoint: https://waitnot-restaurant-app.onrender.com
echo.
pause
echo.

echo ========================================
echo TEST 1: HEALTH CHECK
echo ========================================
echo.
echo Testing: GET /api/voice/health
echo.
curl https://waitnot-restaurant-app.onrender.com/api/voice/health
echo.
echo.
echo Expected: huggingfaceLoaded should be true
echo.
pause
echo.

echo ========================================
echo TEST 2: SIMPLE ORDER (One Pizza)
echo ========================================
echo.
echo Command: "Hey Aman, get me one pizza"
echo.
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, get me one pizza\",\"restaurantId\":\"1\"}"
echo.
echo.
echo Expected: action=order, items=[Pizza], quantity=1, source=huggingface-ai
echo Note: First request may take 10-20 seconds (model loading)
echo.
pause
echo.

echo ========================================
echo TEST 3: COMPLEX ORDER (Multiple Items)
echo ========================================
echo.
echo Command: "Hey Aman, I want two burgers and one coke"
echo.
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, I want two burgers and one coke\",\"restaurantId\":\"1\"}"
echo.
echo.
echo Expected: action=order, items=[Burger x2, Coke x1], source=huggingface-ai
echo Note: Should be faster (6-9 seconds) as models are cached
echo.
pause
echo.

echo ========================================
echo TEST 4: BILL REQUEST
echo ========================================
echo.
echo Command: "Hey Aman, what's my bill?"
echo.
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, what's my bill?\",\"restaurantId\":\"1\"}"
echo.
echo.
echo Expected: action=bill, items=[], reply about bill
echo.
pause
echo.

echo ========================================
echo TEST 5: WITH TABLE NUMBER
echo ========================================
echo.
echo Command: "Hey Aman, get me one pizza" (Table 5)
echo.
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, get me one pizza\",\"restaurantId\":\"1\",\"tableNumber\":\"5\"}"
echo.
echo.
echo Expected: action=order, table=5, items=[Pizza]
echo.
pause
echo.

echo ========================================
echo TEST 6: CANCEL ORDER
echo ========================================
echo.
echo Command: "Hey Aman, cancel the pizza"
echo.
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, cancel the pizza\",\"restaurantId\":\"1\"}"
echo.
echo.
echo Expected: action=cancel, reply about cancellation
echo.
pause
echo.

echo ========================================
echo TEST 7: SHOW ORDER
echo ========================================
echo.
echo Command: "Hey Aman, show me my order"
echo.
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, show me my order\",\"restaurantId\":\"1\"}"
echo.
echo.
echo Expected: action=repeat, reply about showing order
echo.
pause
echo.

echo ========================================
echo ALL TESTS COMPLETE!
echo ========================================
echo.
echo Summary:
echo - Test 1: Health Check (verify AI loaded)
echo - Test 2: Simple Order (one item)
echo - Test 3: Complex Order (multiple items)
echo - Test 4: Bill Request (non-order action)
echo - Test 5: With Table Number (table tracking)
echo - Test 6: Cancel Order (cancel action)
echo - Test 7: Show Order (repeat action)
echo.
echo If all tests show "source":"huggingface-ai", your AI is working!
echo If tests show "source":"fallback", AI failed but fallback works.
echo.
echo Next: Install APK and test in the mobile app!
echo.
pause
