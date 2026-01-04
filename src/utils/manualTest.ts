
import { cleanChatLog } from './chatParser';

const manualSample = `
[22:58:56] Noah Steele: Baksana telefonundan, şarjım az.
Trucker Seviyesi: Van Driver ((1/25))
[23:00:13] > Nathan Steelebir süre bakındıktan sonra telefonu cebine koyar.
`;

const cleaned = cleanChatLog(manualSample);

console.log("--- INPUT ---");
console.log(manualSample);
console.log("--- OUTPUT ---");
console.log(cleaned);
