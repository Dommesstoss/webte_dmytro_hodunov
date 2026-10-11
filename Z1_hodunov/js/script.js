document.addEventListener("DOMContentLoaded", function() {

    const mapElement = document.getElementById("map");
    if(mapElement){
        const map = L.map("map").setView([48.151965, 17.072995], 13);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const schoolCoords = { lat: 48.151965, lng: 17.072995, name: "FEI STU Bratislava" };
        const homeCoords = { lat: 48.140000, lng: 17.120000, name: "Môj domov" };

        L.marker([schoolCoords.lat, schoolCoords.lng])
            .addTo(map)
            .bindPopup(`<b>${schoolCoords.name}</b><br>Škola`);

        L.marker([homeCoords.lat, homeCoords.lng])
            .addTo(map)
            .bindPopup(`<b>${homeCoords.name}</b><br>Bydlisko`);

        let customPoints = JSON.parse(localStorage.getItem("customPoints")) || [];
        let customMarkers = [];
        let routePolyline = null;

        const pointSelect = document.getElementById("point-select");
        const destinationSelect = document.getElementById("destination-select");
        const calculateBtn = document.getElementById("calculate-btn");
        const resultBox = document.getElementById("result-box");
        const emptyState = document.getElementById("empty-state");

        function deletePoint(index) {
            customPoints.splice(index, 1);
            localStorage.setItem("customPoints", JSON.stringify(customPoints));
            
            if (routePolyline) {
                map.removeLayer(routePolyline);
                routePolyline = null;
            }
            
            resultBox.style.display = "none";
            updateUI();
        }

        function updateUI() {
            pointSelect.innerHTML = '<option value="" disabled selected>-- Vyberte miesto --</option><option value="home">Môj domov (Bydlisko)</option>';

            customMarkers.forEach(marker => map.removeLayer(marker));
            customMarkers = [];

            if (customPoints.length === 0) {
                emptyState.style.display = "block";
            } else {
                emptyState.style.display = "none";
            }

            customPoints.forEach((pt, index) => {
                const option = document.createElement("option");
                option.value = index;
                option.textContent = pt.name;
                pointSelect.appendChild(option);

                const marker = L.marker([pt.lat, pt.lng])
                    .addTo(map)
                    .bindPopup(`<b>${pt.name}</b><br><span style="color: red; cursor: pointer;" onclick="deletePoint(${index})"> Vymazať toto miesto</span>`);
                
                customMarkers.push(marker);
            });
        }

        map.on("click", function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            let placeName = prompt("Zadajte názov tohto miesta:");
            if (!placeName || placeName.trim() === "") return;

            const newPoint = { name: placeName.trim(), lat: lat, lng: lng };
            customPoints.push(newPoint);

            localStorage.setItem("customPoints", JSON.stringify(customPoints));
            updateUI();
        });

        function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
            const earthRadiusKm = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
                
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return earthRadiusKm * c;
        }

        calculateBtn.addEventListener("click", function() {
            const selectedValue = pointSelect.value;
            if (selectedValue === "") {
                alert("Prosím, vyberte najskôr bod zo zoznamu.");
                return;
            }

            let startCoord;
            let startName;

            if (selectedValue === "home") {
                startCoord = homeCoords;
                startName = "Môj domov";
            } else {
                const index = parseInt(selectedValue);
                startCoord = customPoints[index];
                startName = startCoord.name;
            }

            const endCoord = schoolCoords;
            const endName = "FEI STU";

            const distance = calculateHaversineDistance(startCoord.lat, startCoord.lng, endCoord.lat, endCoord.lng);

            resultBox.style.display = "block";
            resultBox.innerHTML = `Vzdialenosť medzi <b>${startName}</b> a <b>${endName}</b> je <b>${distance.toFixed(2)} km</b>.`;

            if (routePolyline) {
                map.removeLayer(routePolyline);
            }

            routePolyline = L.polyline([
                [startCoord.lat, startCoord.lng],
                [endCoord.lat, endCoord.lng]
            ], { color: '#2563eb', weight: 4, opacity: 0.8 }).addTo(map);

            map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
        });

        updateUI();
    }
});
