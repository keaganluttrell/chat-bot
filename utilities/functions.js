export async function getLocation() {
	const response = await fetch("https://ipapi.co/json/");
	const { city, region, country } = await response.json();
	return `${city}, ${region}, ${country}`;
}
