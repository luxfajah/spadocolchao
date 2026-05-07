const zip = '8587060085870600';
console.log('Zip:', zip.length === 16 ? zip.slice(0,8) : zip);

const city = 'Foz do IguaçuFoz do Iguaçu';
const half = city.length / 2;
console.log('City:', city.slice(0, half) === city.slice(half) ? city.slice(0, half) : city);

const state = 'PRPR';
console.log('State:', state.length === 4 ? state.slice(0,2) : state);

const streetRaw = 'Rua Angelin Favassa, 2265 Polo Universitário -  Rua Angelin Favassa, 2265 Polo Universitário -';
const firstPart = streetRaw.split(' - ')[0].trim();
const match = firstPart.match(/^([^,]+),\s*([\d\w\/\-]+)\s*(.*)$/);
if (match) {
  console.log('Street:', match[1].trim());
  console.log('Number:', match[2].trim());
  console.log('Neighborhood:', match[3].trim());
} else {
  console.log('No match for:', firstPart);
}
