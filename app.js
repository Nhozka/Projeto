document.addEventListener("DOMContentLoaded", () => {
    const amaranteCoordinates = [41.2721, -8.0826];
    const map = L.map("map", {
        center: amaranteCoordinates,
        zoom: 12,
        minZoom: 12,
        maxZoom: 18,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: 'Projeto Limpezas - Amarante <a href="https://github.com/zeca410/projeto1">Código Fonte</a>',
    }).addTo(map);

    const bounds = L.latLngBounds([41.2611, -8.1016], [41.2831, -8.0636]);
    map.setMaxBounds(bounds);

    let waypoints = [];
    let routeControl = null;

    const updateRemainingDistance = () => {
        const totalDistance = Number.parseInt(document.getElementById("total-distance").innerText, 10);
        const cleanedDistance = Number.parseInt(document.getElementById("cleaned-distance").value, 10);
        document.getElementById("remaining-distance").innerText = totalDistance - cleanedDistance;
    };

    const updateRoute = () => {
        if (routeControl) {
            routeControl.setWaypoints(waypoints);
        } else {
            routeControl = L.Routing.control({
                waypoints,
                show: true,
                routeWhileDragging: true,
            }).addTo(map);

            routeControl.on("routesfound", (e) => {
                const summary = e.routes[0].summary;
                document.getElementById("total-distance").innerText = Math.round(summary.totalDistance);
                updateRemainingDistance();
            });

            routeControl.on("waypointschanged", (e) => {
                waypoints = e.waypoints.map(wp => wp.latLng);
            });

            routeControl.on('routingerror', (e) => {
                console.error("Routing error:", e);
            });
        }
    };

    map.on("click", (e) => {
        if (waypoints.length < 2) {
            waypoints.push(e.latlng);
            updateRoute();
        }
    });

    document.getElementById("update-button").addEventListener("click", updateRemainingDistance);

    document.getElementById("save-data").addEventListener("click", () => {
        const data = {
            waypoints: waypoints.map(({ lat, lng }) => [lat, lng]),
            totalDistance: document.getElementById("total-distance").innerText,
            cleanedDistance: document.getElementById("cleaned-distance").value,
            remainingDistance: document.getElementById("remaining-distance").innerText,
            name: document.getElementById("name").value,
            date: document.getElementById("date").innerText,
            time: document.getElementById("time").innerText,
        };
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dados_limpeza.json";
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(function(){
            location.reload(true);
        }, 1000);
    });

    document.getElementById("load-data").addEventListener("click", () => {
        document.getElementById("file-input").click();
    });

    document.getElementById("file-input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    waypoints = data.waypoints.map(([lat, lng]) => L.latLng(lat, lng));
                    document.getElementById("total-distance").innerText = data.totalDistance;
                    document.getElementById("cleaned-distance").value = data.cleanedDistance;
                    document.getElementById("remaining-distance").innerText = data.remainingDistance;
                    document.getElementById("name").placeholder = data.name || '';
                    updateRoute();
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            };
            reader.readAsText(file);
        }
    });

    const fetchDateTime = async () => {
        try {
            const response = await fetch("https://worldtimeapi.org/api/timezone/Europe/Lisbon");
            const data = await response.json();
            const dateTime = new Date(new Date(data.datetime).getTime() + 3600 * 1000); // Add 1 hour
            document.getElementById("date").innerText = dateTime.toLocaleDateString("pt-PT");
            document.getElementById("time").innerText = dateTime.toLocaleTimeString("pt-PT");
        } catch (error) {
            console.error("Error fetching date and time:", error);
            document.getElementById("date").innerText = "Error loading date";
            document.getElementById("time").innerText = "Error loading time";
        }
    };

    fetchDateTime();
    setInterval(fetchDateTime, 1000);
});
