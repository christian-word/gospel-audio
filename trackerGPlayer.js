 const BIN_ID = "685d4e938a456b7966b61f6e";
 const API_KEY = "$2a$10$foT8lIkBZ.MYNt758MsuJuBvxxI750/hg4QyQXX.Q7b2vu/G0/irm";
 const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

async function sendVisitData() {
    try {
        // 1. Получаем IP
        const ipResponse = await fetch("https://api64.ipify.org?format=json");
        const ipData = await ipResponse.json();
        const userIP = ipData.ip || "Неизвестно";

        // 2. Геолокация через 2 API (основное + fallback)
        let geoData = { country: "Неизвестно", city: "Неизвестно" };
        
        try {
            // Пробуем первый сервис (ipapi.co)
            const geoResponse1 = await fetch(`https://ipapi.co/${userIP}/json/`);
            if (geoResponse1.ok) {
                const data1 = await geoResponse1.json();
                if (data1.country_name) geoData.country = data1.country_name;
                if (data1.city) geoData.city = data1.city;
            } else {
                // Fallback: второй сервис (ip-api.com)
                const geoResponse2 = await fetch(`http://ip-api.com/json/${userIP}?fields=country,city`);
                if (geoResponse2.ok) {
                    const data2 = await geoResponse2.json();
                    if (data2.country) geoData.country = data2.country;
                    if (data2.city) geoData.city = data2.city;
                }
            }
        } catch (e) {
            console.error("Ошибка геолокации:", e);
        }

        // 3. Собираем все данные
        const userInfo = {
            ip: userIP,
            time: new Date().toISOString(), // ISO-формат для корректного парсинга
            country: geoData.country,
            city: geoData.city,
            browser: navigator.userAgent,
            screen: `${window.screen.width}x${window.screen.height}`,
            referrer: document.referrer || "Прямой заход",
            device: /Mobi|Android/i.test(navigator.userAgent) ? "Мобильное" : "Десктоп",
            isNewVisit: !localStorage.getItem('visited') // Проверка нового визита
        };

        // 4. Отправляем данные
        const currentData = await (await fetch(`${API_URL}/latest`, {
            headers: { "X-Master-Key": API_KEY }
        })).json().catch(() => ({ record: { visits: 0, users: [] } }));

        const updatedData = {
            visits: (currentData.record?.visits || 0) + 1,
            users: [...(currentData.record?.users || []), userInfo]
        };

        await fetch(API_URL, {
            method: "PUT",
            headers: {
                "X-Master-Key": API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
        });

        // Помечаем визит (для isNewVisit)
        localStorage.setItem('visited', 'true');

    } catch (error) {
        console.error("Ошибка:", error);
    }
}

// Запускаем при загрузке страницы
sendVisitData();