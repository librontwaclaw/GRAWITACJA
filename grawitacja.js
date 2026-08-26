// Zmienne kontrolne dla animowanej supernowej
var supernowaAktywna = false;
var supernowaPromien = 100; // Rozmiar startowy przed zapadnięciem
var supernowaMasa = 5000;   // Ogromna masa ściągająca wszystko do środka
var supernowaX = 0; // <-- NOWOŚĆ: stała pozycja X eksplozji
var supernowaY = 0; // <-- NOWOŚĆ: stała pozycja Y eksplozji
// Zmienne kontrolne dla animowanej supernowej
var MASA_KRYTYCZNA = 1500;  // <-- NOWOŚĆ: Masa potrzebna do wywołania kolejnego wybuchu
var idMAX_MASA = document.getElementById("idMAX_MASA");
var pauza = false; // <-- NOWOŚĆ: Stan pauzy symulatora

function animacja() {
	// Sprawdzamy, czy użytkownik włączył kosmiczne tło na samym początku, aby zmienna była dostępna globalnie
	var ciemneTlo = document.getElementById("TRYB_CIEMNY") ? document.getElementById("TRYB_CIEMNY").checked : false;

	// Rysowanie ramki na głównym canvasie (kolor dostosowuje się do wybranego tła)
	GR.strokeStyle = ciemneTlo ? "#7f8c8d" : "#2c3e50"; 
	GR.strokeRect(0, 0, w, h);

	// 1. Jeśli jest pauza, wyświetlamy tylko komunikat i zatrzymujemy fizykę
	if (pauza == true) {
		// Rysujemy półprzezroczysty napis "PAUZA" dopasowany kontrastem do tła
		GR.fillStyle = ciemneTlo ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";
		GR.font = "bold 40px sans-serif";
		GR.textAlign = "center";
		GR.fillText("PAUZA", w / 2, h / 2);
		
		TestowanieMyszki();
		ObslugaMyszki();

		clearTimeout(czas);
		czas = setTimeout(animacja, skok);
		return; 
	}

	// 2. STANDARDOWY KOD FIZYKI (wykonuje się tylko gdy pauza == false)
	GR.clearRect(0, 0, w, h);
	
	AktualizujSupernowa();

	// OPTYMALIZACJA ŚLADÓW: Płynne ściemnianie/zanikania na dolnym canvasie
	var elementSlady = document.getElementById("SLADY_ON");
	var rysujSlady = elementSlady ? elementSlady.checked : true;

	if (rysujSlady == true) {
		if (ciemneTlo) {
			GR_SLADY.fillStyle = "rgba(13, 17, 23, 0.04)"; // Czarny filtr dla trybu nocnego
		} else {
			GR_SLADY.fillStyle = "rgba(255, 255, 255, 0.03)"; // Biały filtr dla trybu jasnego
		}
		GR_SLADY.fillRect(0, 0, w, h);
	} else {
		GR_SLADY.clearRect(0, 0, w, h);
	}

	TestowanieMyszki();
	ObslugaMyszki();
	RysujMasa();
	idKULE.innerHTML = PLANETY.length;
	
	// === DETEKTOR MASY MAKSYMALNEJ I KOLEJNEGO BUM ===
	var maxMasa = 0;
	var indeksNajwiekszej = -1; // Zapamiętujemy pozycję najcięższego ciała
	
		// === BEZPIECZNY DETEKTOR MASY MAKSYMALNEJ I KOLEJNEGO BUM ===
	var maxMasa = 0;
	var indeksNajwiekszej = -1;
	
	for (var i = 0; i < PLANETY.length; i++) {
		if (PLANETY[i] && PLANETY[i].m > maxMasa) {
			maxMasa = PLANETY[i].m;
			indeksNajwiekszej = i;
		}
	}
	
	if (idMAX_MASA) {
		idMAX_MASA.innerHTML = Math.round(maxMasa);
	}
	
	var idPROG_SUPERNOVA = document.getElementById("idPROG_SUPERNOVA");
	if (idPROG_SUPERNOVA && typeof MASA_KRYTYCZNA !== 'undefined') {
		idPROG_SUPERNOVA.innerHTML = MASA_KRYTYCZNA;
	}

	// Automatyczna aktywacja kolejnej supernowej BEZ RESETU ŚRODOWISKA
	if (maxMasa >= MASA_KRYTYCZNA && !supernowaAktywna && indeksNajwiekszej !== -1) {
		var m2 = indeksNajwiekszej; 
		
		// Zapamiętujemy dokładną pozycję i potężną masę skupiska planet
		supernowaX = PLANETY[m2].x;
		supernowaY = PLANETY[m2].y;
		var zgromadzonaMasa = PLANETY[m2].m;

		// POPRAWKA: Usuwamy TYLKO TĘ JEDNĄ planetę z tablicy (reszta kosmosu zostaje nienaruszona!)
		PLANETY.splice(m2, 1);

		// Inicjalizacja trybu zapadania się jądra
		supernowaAktywna = true;
		supernowaPromien = Math.min(130, Math.round(Math.sqrt(zgromadzonaMasa))); 

		// Tworzymy NOWĄ gwiazdę implozyjną o ogromnej masie grawitacyjnej
		var nowaGwiazda = {
			x: supernowaX,
			y: supernowaY,
			vx: 0,
			vy: 0,
			ax: 0,
			ay: 0,
			old_ax: 0,
			old_ay: 0,
			r: supernowaPromien,
			m: zgromadzonaMasa, // Jej potężna grawitacja będzie teraz zasysać inne planety w locie!
			k: "#2c3e50" 
		};
		// Wrzucamy ją na początek tablicy, aby AktualizujSupernowa() łatwo nią zarządzała
		PLANETY.unshift(nowaGwiazda);
	}

	// ==================================================

	var g = document.getElementById("WER").checked;
	if (g == true) {
		Verlet();
	} else {
		
		ObliczZderzenia();
		for (var i = 0; i < PLANETY.length; i++){
			PLANETY[i].x += PLANETY[i].vx;
			PLANETY[i].y += PLANETY[i].vy;
			
			var gr = document.getElementById("GR").checked;
			if (gr == true){
				if (PLANETY[i].x < 0 || PLANETY[i].x > w) PLANETY[i].vx = -PLANETY[i].vx;
				if (PLANETY[i].y < 0 || PLANETY[i].y > h) PLANETY[i].vy = -PLANETY[i].vy;
			}
			Planeta(PLANETY[i]);
		}
	}
	
	// Czyszczenie wywołujemy tylko wtedy, gdy supernowa nie przeprowadza właśnie narodzin odłamków
	if (!supernowaAktywna) {
		CzyscPlanety();
	}
	
	clearTimeout(czas);
	czas = setTimeout(animacja, skok); 
}



function TestowanieMyszki(){	
	document.getElementById('TEST').innerHTML = 
	"(" + MYSZKA.x + "," + MYSZKA.y + ") " +
	"(" + MYSZKAon.x + "," + MYSZKAon.y + ") " +
	"(" + MYSZKAoff.x + "," + MYSZKAoff.y + ")";
	if (MyszPrzycisk == 1) idLASER.innerHTML = predkosc();
}

function Planeta(planetaObj) {
	var m = planetaObj.m;
	var r = planetaObj.r;

	// Obliczamy pozycję na ekranie względem środka płótna, uwzględniając zoom
	var srodekX = w / 2;
	var srodekY = h / 2;
	var ekranX = srodekX + (planetaObj.x - srodekX) * skala;
	var ekranY = srodekY + (planetaObj.y - srodekY) * skala;
	var ekranR = r * skala;

	// Zabezpieczenie: nie rysujemy obiektów, które stały się niewidoczne/za małe
	if (ekranR < 0.1) return;

	// Dynamiczne kolorowanie na podstawie masy (Twój dotychczasowy kod)
	var k = planetaObj.k;
	if (m > 0) {
		if (m < 30) k = "#7f8c8d";
		else if (m >= 30 && m < 150) k = "#3498db";
		else if (m >= 150 && m < 500) k = "#e67e22";
		else k = "#e74c3c";
	}

	var elementSlady = document.getElementById("SLADY_ON");
	var rysujSlady = elementSlady ? elementSlady.checked : true;

	// RYSOWANIE ŚLADU (Musi być na warstwie śladów, również przeskalowane)
	if (rysujSlady == true && m > 0) {
		GR_SLADY.beginPath();
		GR_SLADY.fillStyle = k + "26"; 
		GR_SLADY.arc(ekranX, ekranY, Math.max(1, ekranR * 0.3), 0, 2 * Math.PI);
		GR_SLADY.fill();
	}

	// RYSOWANIE WŁAŚCIWEJ PLANETY (Górna warstwa)
	GR.beginPath();
	GR.strokeStyle = "#2c3e50";
	GR.lineWidth = 1;
	GR.fillStyle = k;
	GR.arc(ekranX, ekranY, ekranR, 0, 2 * Math.PI);
	GR.stroke();
	GR.fill();
}



function ObslugaMyszki(){
	if (MyszPrzycisk == 1){
		LINIA(MYSZKAon.x, MYSZKAon.y, MYSZKA.x, MYSZKA.y, "red");
		PLANETA.x = MYSZKAon.x;
		PLANETA.y = MYSZKAon.y;
		PLANETA.r = idMAS.value / 10;
		PLANETA.m = idMAS.value * 1.0;
	}
	if (MyszPrzycisk == -1){
		PLANETA.vx = (MYSZKAoff.x - MYSZKAon.x) / 20;
		PLANETA.vy = (MYSZKAoff.y - MYSZKAon.y) / 20;
		MyszPrzycisk = 0;
		StartPlanety();
		idKULE.innerHTML = PLANETY.length;
	}
	
	// Podgląd tworzonej planety pod kursorem myszy
	if (MyszPrzycisk == 1 || MyszPrzycisk == 0) {
		Planeta(PLANETA);
	}
}

// Zarządzanie masą w UI
function FMasa(){
	idMASL.innerHTML = idMAS.value;
}
function RysujMasa(){
	var r = idMAS.value / 10;
	var kol = "rgba(255,0,0,0.2)";
	
	var podglad = { x: 5 + r, y: h - 5 - r, r: r, m: 0, k: kol };
	Planeta(podglad);
}

// Laser do nadawania prędkości
function LINIA(x1, y1, x2, y2, kol) {
	GR.strokeStyle = kol;
	GR.beginPath(); 
	GR.moveTo(x1, y1); 
	GR.lineTo(x2, y2);
	GR.stroke();
}

function predkosc(){
	var dx = (MYSZKA.x - MYSZKAon.x);
	var dy = (MYSZKA.y - MYSZKAon.y);
	var pr = Math.round(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)));
	return pr;
}

// Dodawanie nowej planety
function StartPlanety(){
	var PL = {
		x: PLANETA.x,
		y: PLANETA.y,
		vx: PLANETA.vx,
		vy: PLANETA.vy,
		r: PLANETA.r,
		m: PLANETA.m,
		ax: 0,
		ay: 0,
		k: "black"
	};
	PLANETY.push(PL);
	PLANETA.r = 0;
	PLANETA.m = 0;
}

// Zderzenia sprężyste
function ObliczZderzenia(){
	for (var i = 0; i < PLANETY.length - 1; i++){
		for (var j = i + 1; j < PLANETY.length; j++){ 
			var x1 = PLANETY[i].x;
			var x2 = PLANETY[j].x;
			var y1 = PLANETY[i].y;
			var y2 = PLANETY[j].y;
			var d = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));	
			
			if (d <= PLANETY[i].r + PLANETY[j].r && d > 0){
				var m1 = PLANETY[i].m * 1;
				var m2 = PLANETY[j].m * 1;
				var ux1 = PLANETY[i].vx;
				var uy1 = PLANETY[i].vy;
				var ux2 = PLANETY[j].vx;
				var uy2 = PLANETY[j].vy;
				
				var vx1 = (m1 - m2) / (m1 + m2) * ux1 + 2 * m2 / (m1 + m2) * ux2;
				var vy1 = (m1 - m2) / (m1 + m2) * uy1 + 2 * m2 / (m1 + m2) * uy2;
				var vx2 = (m2 - m1) / (m1 + m2) * ux2 + 2 * m1 / (m1 + m2) * ux1;
				var vy2 = (m2 - m1) / (m1 + m2) * uy2 + 2 * m1 / (m1 + m2) * uy1;
				
				PLANETY[i].vx = vx1;
				PLANETY[i].vy = vy1;
				PLANETY[j].vx = vx2;
				PLANETY[j].vy = vy2;
				
				// Rozsuwanie nakładających się kulek (antysklejanie)
				var overlap = (PLANETY[i].r + PLANETY[j].r) - d;
				var overlapX = ((x1 - x2) / d) * overlap * 0.5;
				var overlapY = ((y1 - y2) / d) * overlap * 0.5;
				PLANETY[i].x += overlapX;
				PLANETY[i].y += overlapY;
				PLANETY[j].x -= overlapX;
				PLANETY[j].y -= overlapY;
			}
		}
	}
}

// Integracja fizyki metodą Velocity Verlet
function Verlet(){
	// KROK 1: Aktualizacja pozycji
	for (var i = 0; i < PLANETY.length; i++){
		if (!PLANETY[i] || PLANETY[i].m <= 0) continue; // Zabezpieczenie przed undefined
		
		PLANETY[i].x += PLANETY[i].vx * dt + 0.5 * PLANETY[i].ax * dt * dt;
		PLANETY[i].y += PLANETY[i].vy * dt + 0.5 * PLANETY[i].ay * dt * dt;
		
		PLANETY[i].old_ax = PLANETY[i].ax;
		PLANETY[i].old_ay = PLANETY[i].ay;
		
		PLANETY[i].ax = 0;
		PLANETY[i].ay = 0;
	}
	
	// KROK 2: Obliczenie sił grawitacji
	for (var i = 0; i < PLANETY.length; i++){
		if (!PLANETY[i] || PLANETY[i].m <= 0) continue; // Zabezpieczenie przed undefined
		for (var j = 0; j < PLANETY.length; j++){
			if (!PLANETY[j] || PLANETY[j].m <= 0) continue; // Zabezpieczenie przed undefined
			
			if (i != j){ 
				var x1 = PLANETY[i].x;
				var x2 = PLANETY[j].x;
				var y1 = PLANETY[i].y;
				var y2 = PLANETY[j].y;
				var d = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
				
				Zderzenia(d, i, j);
				if (d < 1) d = 1;
				
				// Dodatkowe upewnienie się, że obiekt nadal istnieje po funkcji Zderzenia
				if (PLANETY[i] && PLANETY[j] && PLANETY[i].m > 0 && PLANETY[j].m > 0) {
					PLANETY[i].ax += -G * PLANETY[j].m * (x1 - x2) / Math.pow(d, 3);
					PLANETY[i].ay += -G * PLANETY[j].m * (y1 - y2) / Math.pow(d, 3);
				}
			} 
		} 
	}
	
	// KROK 3: Aktualizacja prędkości i rysowanie
	for (var i = 0; i < PLANETY.length; i++){
		if (!PLANETY[i] || PLANETY[i].m <= 0) continue; // Zabezpieczenie przed undefined
		
		PLANETY[i].vx += 0.5 * (PLANETY[i].old_ax + PLANETY[i].ax) * dt;
		PLANETY[i].vy += 0.5 * (PLANETY[i].old_ay + PLANETY[i].ay) * dt;
		
		var gr = document.getElementById("GR").checked;
		if (gr == true){
			if (PLANETY[i].x < 0 || PLANETY[i].x > w) PLANETY[i].vx = -PLANETY[i].vx;
			if (PLANETY[i].y < 0 || PLANETY[i].y > h) PLANETY[i].vy = -PLANETY[i].vy;
		}
		
		Planeta(PLANETY[i]);
	}
}


// Zderzenia niesprężyste (fuzja)
function Zderzenia(d, i, j){
	if (d <= PLANETY[i].r + PLANETY[j].r){
		if (PLANETY[i].m >= PLANETY[j].m){
			var m2 = i;
			var m1 = j;
		} else {
			var m2 = j;
			var m1 = i;
		}
		
		// Zasada zachowania pędu
		PLANETY[m2].vx = (PLANETY[m2].vx * PLANETY[m2].m + PLANETY[m1].vx * PLANETY[m1].m) / (PLANETY[m2].m + PLANETY[m1].m);
		PLANETY[m2].vy = (PLANETY[m2].vy * PLANETY[m2].m + PLANETY[m1].vy * PLANETY[m1].m) / (PLANETY[m2].m + PLANETY[m1].m);
		
		// Sumowanie mas oraz pól powierzchni
		PLANETY[m2].m = PLANETY[m2].m * 1 + PLANETY[m1].m * 1;
		PLANETY[m2].r = Math.sqrt(PLANETY[m2].r * PLANETY[m2].r + PLANETY[m1].r * PLANETY[m1].r);
		
		// Zerowanie fizyczne i unicestwienie pochłoniętej planety
		PLANETY[m1].vx = 0;
		PLANETY[m1].vy = 0;
		PLANETY[m1].ax = 0;
		PLANETY[m1].ay = 0;
		PLANETY[m1].m = 0;
		PLANETY[m1].r = 0;

	}
}


// Bezpieczne usuwanie planet
function CzyscPlanety(){
	for (var i = PLANETY.length - 1; i >= 0; i--){
		if (PLANETY[i].m == 0) PLANETY.splice(i, 1);
	}
}

function losowa(p, k) {
	return Math.floor(Math.random() * (k - p + 1) + p);
}

// Generator Wybuchów
function LosujPlanety(){
	var ile = idBUM.value;
	PLANETY.length = 0;
	supernowaAktywna = false;
	
	GR_SLADY.clearRect(0, 0, w, h);
	var typBum = document.getElementById("idTYP_BUM").value;
	
	if (typBum === "rozproszona") {
		for (var i = 0; i < ile; i++){
			var PL = {};
			var max_v = 8;
			PL.x = losowa(20, w - 20);
			PL.y = losowa(20, h - 20);
			PL.vx = losowa(-max_v, max_v) / 10; 
			PL.vy = losowa(-max_v, max_v) / 10;
			PL.ax = 0;
			PL.ay = 0;
			PL.m = losowa(10, 40);
			PL.r = PL.m / 10;
			if (PL.r <= 0.5) PL.r = 0.5;
			PL.k = "black";
			PLANETY.push(PL);
		}
	} else if (typBum === "supernowa") {
		supernowaAktywna = true;
		supernowaPromien = 120; 
		
		var superGwiazda = {
			x: w / 2,
			y: h / 2,
			vx: 0,
			vy: 0,
			ax: 0,
			ay: 0,
			r: supernowaPromien,
			m: supernowaMasa,
			k: "#2c3e50" 
		};
		PLANETY.push(superGwiazda);
	}
}

function AktualizujSupernowa() {
	// Jeśli tryb nie jest aktywny lub gwiazda z jakiegoś powodu zniknęła – przerywamy
	if (!supernowaAktywna || PLANETY.length === 0) return;

	// Pobieramy pierwszy element z tablicy (wielką gwiazdę)
	var gwiazdaObj = PLANETY[0]; 
	if (!gwiazdaObj) return;

	// Gwiazda gwałtownie się kurczy
	supernowaPromien -= 3; 
	gwiazdaObj.r = supernowaPromien; 

	// Zmiana kolorów rozgrzewającego się jądra gwiazdy
	if (supernowaPromien < 80 && supernowaPromien >= 40) gwiazdaObj.k = "#e67e22"; // Pomarańczowy
	if (supernowaPromien < 40) gwiazdaObj.k = "#f1c40f"; // Żółty biały żar

	// MOMENT KRYTYCZNY: Gwiazda osiąga punkt zero - czas na BUM!
		// MOMENT KRYTYCZNY: Gwiazda osiąga punkt zero - czas na BUM!
	if (supernowaPromien <= 4) {
		supernowaAktywna = false; // Koniec fali implozji
		
		var ileOdlamkow = parseInt(idBUM.value); 
		var srodekX = gwiazdaObj.x; 
		var srodekY = gwiazdaObj.y; 
		
		// POPRAWKA: Usuwamy TYLKO gwiazdę centralną (pierwszy element z tablicy)
		PLANETY.shift(); 
		
		// Generowanie nowych, małych odłamków, które dołączą do starych planet!
		for (var i = 0; i < ileOdlamkow; i++) {
			var kat = (i / ileOdlamkow) * 2 * Math.PI; 
			var silaWyrzutu = (losowa(25, 60) / 10); 
			
			var m_losowa = losowa(12, 35); 
			var r_losowy = m_losowa / 10;
			if (r_losowy <= 0.5) r_losowy = 0.5;

			var losowyPromienStartowy = losowa(50, 110);
			var startX = srodekX + Math.cos(kat) * losowyPromienStartowy;
			var startY = srodekY + Math.sin(kat) * losowyPromienStartowy;

			var PL = {
				x: startX, 
				y: startY,
				vx: Math.cos(kat) * silaWyrzutu,
				vy: Math.sin(kat) * silaWyrzutu,
				ax: 0,
				ay: 0,
				old_ax: 0,   
				old_ay: 0,   
				m: m_losowa,
				r: r_losowy
			};
			
			var elementTlo = document.getElementById("TRYB_CIEMNY");
			var jestCiemneTlo = elementTlo ? elementTlo.checked : false;
			PL.k = jestCiemneTlo ? "#ecf0f1" : "black"; 

			// Odłamki zostają DOPISANE do tablicy, mieszając się ze starymi planetami
			PLANETY.push(PL);
		}
		
		idKULE.innerHTML = PLANETY.length;
	}

}


function FBum(){
	idILE.innerHTML = idBUM.value;
}

// Funkcja aktualizująca próg supernowej z suwaka w locie
function FAktualizujProg() {
	var suwak = document.getElementById("idPROG_SUWAK");
	var tekstWartosc = document.getElementById("idPROG_WARTOSC");
	var tekstWStatystykach = document.getElementById("idPROG_SUPERNOVA");
	
	if (suwak) {
		// Aktualizujemy zmienną globalną, z której korzysta detektor wybuchów
		MASA_KRYTYCZNA = parseInt(suwak.value);
		
		// Aktualizujemy etykiety tekstowe w HTML
		if (tekstWartosc) tekstWartosc.innerHTML = suwak.value;
		if (tekstWStatystykach) tekstWStatystykach.innerHTML = suwak.value;
	}
}

// Dynamiczna zmiana tła symulatora w locie
function FZmianaTla() {
	var ciemneTlo = document.getElementById("TRYB_CIEMNY").checked;
	var c_slady = document.getElementById("canvasSlady");
	
	if (ciemneTlo) {
		c_slady.style.background = "#0d1117"; // Głęboka, kosmiczna czerń
	} else {
		c_slady.style.background = "white";    // Klasyczna biel
	}
	// Czyścimy warstwę śladów, aby natychmiast pozbyć się starego koloru smug
	GR_SLADY.clearRect(0, 0, w, h);
}

// Funkcja obsługująca przyciski zoomu na telefonach
function FZoomMobilny(mnoznik) {
	// Mnożymy aktualną skalę przez zadany współczynnik
	skala *= mnoznik;

	// Pilnujemy zdefiniowanych wcześniej limitów min/max
	if (skala < minSkala) skala = minSkala;
	if (skala > maxSkala) skala = maxSkala;

	// Czyścimy warstwę śladów, aby stare ogony planet nie rozmazały się w złych miejscach
	if (typeof GR_SLADY !== 'undefined') {
		GR_SLADY.clearRect(0, 0, w, h);
	}
}
