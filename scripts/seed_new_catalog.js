const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ==========================================
// 1. DADOS DE INSUMOS (50 MATÉRIAS-PRIMAS)
// ==========================================
const INSUMOS = [
  { code: 'INS-MAD-001', name: 'Madeira Bruta Ripa 5x2cm x 3m', category: 'Madeiras e Chapas', unit: 'M3', cost: 1600, spec: 'Ripas 5 x 2 x 3,00m comprimento', source: 'Manuscrito 04' },
  { code: 'INS-MAD-002', name: 'Madeira Serrada para Baú Sienna', category: 'Madeiras e Chapas', unit: 'M3', cost: 2000, spec: 'Madeira tratada para caixaria de baú', source: 'Manuscritos 13-16' },
  { code: 'INS-MDF-015', name: 'Chapa MDF Crua 15mm 2,76x1,86m', category: 'Madeiras e Chapas', unit: 'M2', cost: 23.4, spec: 'Chapa 15mm (5,1336 m² / R$ 120,00 chapa)', source: 'Manuscrito 04/32' },
  { code: 'INS-MDF-006', name: 'Chapa MDF Crua 6mm 2,76x1,86m', category: 'Madeiras e Chapas', unit: 'M2', cost: 14, spec: 'Chapa 6mm (5,1336 m² / R$ 80,00 chapa)', source: 'Manuscrito 04/32' },
  { code: 'INS-MDF-004', name: 'Chapa MDF Crua 4mm 2,76x1,86m', category: 'Madeiras e Chapas', unit: 'M2', cost: 16.46, spec: 'Chapa 4mm (5,1336 m² / R$ 100,00 chapa)', source: 'Manuscrito 04/09' },
  { code: 'INS-MDF-003', name: 'Chapa MDF Crua 3mm 2,76x1,86m', category: 'Madeiras e Chapas', unit: 'M2', cost: 19.5, spec: 'Chapa 3mm para sustentação de colchão', source: 'Manuscritos 28-35' },
  { code: 'INS-ESP-D28', name: 'Espuma Poliuretano D-28 Bloco', category: 'Espumas e Estruturais', unit: 'M3', cost: 950, spec: 'Densidade 28 para bordas e tampos', source: 'Manuscritos 20-35' },
  { code: 'INS-ESP-R26-5CM', name: 'Espuma Aglomerada R-26 (5 cm)', category: 'Espumas e Estruturais', unit: 'M3', cost: 920, spec: 'Camada de conforto de 5cm para reforma', source: 'Manuscritos 05-12' },
  { code: 'INS-ESP-R26-1CM', name: 'Espuma Aglomerada R-26 (1 cm)', category: 'Espumas e Estruturais', unit: 'M3', cost: 920, spec: 'Lâmina de 1cm acolchoamento lateral baú', source: 'Manuscritos 13-16' },
  { code: 'INS-EPS-307', name: 'Isopor EPS Alta Densidade', category: 'Espumas e Estruturais', unit: 'M3', cost: 307, spec: 'Bloco estrutural ortopédico leve', source: 'Manuscritos 28-35' },
  { code: 'INS-RAB-001', name: 'Rabatan Perfilado Vulcanizado Solteiro', category: 'Espumas e Estruturais', unit: 'UN', cost: 111, spec: 'Perfilado piramidal massagem Solteiro', source: 'Manuscrito 28' },
  { code: 'INS-RAB-002', name: 'Rabatan Perfilado Vulcanizado Casal', category: 'Espumas e Estruturais', unit: 'UN', cost: 175, spec: 'Perfilado piramidal massagem Casal', source: 'Manuscrito 29' },
  { code: 'INS-RAB-003', name: 'Rabatan Perfilado Vulcanizado Queen', category: 'Espumas e Estruturais', unit: 'UN', cost: 200, spec: 'Perfilado piramidal massagem Queen', source: 'Manuscrito 30' },
  { code: 'INS-RAB-004', name: 'Rabatan Perfilado Vulcanizado King', category: 'Espumas e Estruturais', unit: 'UN', cost: 245, spec: 'Perfilado piramidal massagem King', source: 'Manuscrito 35' },
  { code: 'INS-TEC-MAT', name: 'Tecido Matelassê Tampo Acolchoado', category: 'Tecidos e TNT', unit: 'M', cost: 55, spec: 'Rolos acolchoamento grosso para tampo', source: 'Manuscrito 01/04' },
  { code: 'INS-TEC-VEL', name: 'Tecido Veludo Faixa 1,40m', category: 'Tecidos e TNT', unit: 'M', cost: 11, spec: 'Largura 1,40m (Marrom, Bege, Preto, Cinza)', source: 'Manuscrito 01/04' },
  { code: 'INS-TNT-080', name: 'TNT Gramatura 80g Largura 2,10m', category: 'Tecidos e TNT', unit: 'M', cost: 5.38, spec: 'Rolo 2,10m antiderrapante box e fundo', source: 'Manuscrito 01/04' },
  { code: 'INS-TNT-040', name: 'TNT Gramatura 40g Largura 1,40m', category: 'Tecidos e TNT', unit: 'M', cost: 1.79, spec: 'Rolo 1,40m forro sob matelassê', source: 'Manuscrito 01/04' },
  { code: 'INS-MOL-BON-SOL', name: 'Molejo Bonnel Solteiro 88x188', category: 'Molejos', unit: 'UN', cost: 73, spec: 'Molas bi-cônicas de aço carbono 88x188', source: 'Manuscrito 20' },
  { code: 'INS-MOL-BON-CAS', name: 'Molejo Bonnel Casal 138x188', category: 'Molejos', unit: 'UN', cost: 120, spec: 'Molas bi-cônicas de aço carbono 138x188', source: 'Manuscrito 26' },
  { code: 'INS-MOL-BON-QUE', name: 'Molejo Bonnel Queen 158x198', category: 'Molejos', unit: 'UN', cost: 145.5, spec: 'Molas bi-cônicas de aço carbono 158x198', source: 'Manuscrito 22' },
  { code: 'INS-MOL-BON-KIN', name: 'Molejo Bonnel King 193x203', category: 'Molejos', unit: 'UN', cost: 173, spec: 'Molas bi-cônicas de aço carbono 193x203', source: 'Manuscrito 23' },
  { code: 'INS-MOL-POC-SOL', name: 'Molejo Pocket Ensacado Solteiro', category: 'Molejos', unit: 'UN', cost: 118.5, spec: 'Molas ensacadas individualmente 88x188', source: 'Manuscrito 24' },
  { code: 'INS-MOL-POC-CAS', name: 'Molejo Pocket Ensacado Casal', category: 'Molejos', unit: 'UN', cost: 192, spec: 'Molas ensacadas individualmente 138x188', source: 'Manuscrito 25' },
  { code: 'INS-MOL-POC-QUE', name: 'Molejo Pocket Ensacado Queen', category: 'Molejos', unit: 'UN', cost: 234, spec: 'Molas ensacadas individualmente 158x198', source: 'Manuscrito 31' },
  { code: 'INS-MOL-POC-KIN', name: 'Molejo Pocket Ensacado King', category: 'Molejos', unit: 'UN', cost: 290, spec: 'Molas ensacadas individualmente 193x203', source: 'Manuscrito 27' },
  { code: 'INS-FEL-RES', name: 'Feltro Resinado Termo-fixado', category: 'Molejos', unit: 'M2', cost: 6.57, spec: 'Manta protetora isolante sobre molas', source: 'Manuscritos 20-31' },
  { code: 'INS-GRA-1438', name: 'Grampo Pesado 14/38 Estrutural', category: 'Ferragens e Fixadores', unit: 'UN', cost: 0.0241, spec: 'Fixação pesada de madeira de box', source: 'Manuscritos 05-17' },
  { code: 'INS-GRA-9230', name: 'Grampo Médio 92/30 Marcenaria', category: 'Ferragens e Fixadores', unit: 'UN', cost: 0.0174, spec: 'Fixação de chapas de MDF na estrutura', source: 'Manuscritos 09-17' },
  { code: 'INS-GRA-8008', name: 'Grampo Tapeceiro 80/08 Leve', category: 'Ferragens e Fixadores', unit: 'UN', cost: 0.0035, spec: 'Fixação de veludo e TNT', source: 'Manuscritos 05-17' },
  { code: 'INS-GRA-8012', name: 'Grampo Tapeceiro 80/12 Médio', category: 'Ferragens e Fixadores', unit: 'UN', cost: 0.0013, spec: 'Fixação de forros e tecidos', source: 'Manuscrito 04' },
  { code: 'INS-BUC-516', name: 'Bucha Americana Metálica 5/16', category: 'Ferragens e Fixadores', unit: 'UN', cost: 0.2, spec: 'Bucha rosqueável 5/16 x 3/4 p/ pés', source: 'Manuscritos 09-17' },
  { code: 'INS-PAR-6025', 'name': 'Parafuso Sextavado 6,0 x 0,25', category: 'Ferragens e Fixadores', unit: 'UN', cost: 0.12, spec: 'Fixação da articulação de baú', source: 'Manuscritos 13-16' },
  { code: 'INS-PE-PLA-12', name: 'Pezinho Plástico 12cm c/ Rosca', category: 'Acessórios de Box e Baú', unit: 'UN', cost: 1.52, spec: 'Pé injetado 12cm para Box Life', source: 'Manuscritos 09-17' },
  { code: 'INS-PE-PLA-06', name: 'Pezinho Plástico 6cm c/ Rosca', category: 'Acessórios de Box e Baú', unit: 'UN', cost: 1, spec: 'Pé rebaixado 6cm para Box Baú Sienna', source: 'Manuscritos 13-16' },
  { code: 'INS-CAN-PLA', name: 'Cantoneira Plástica Protetora', category: 'Acessórios de Box e Baú', unit: 'UN', cost: 0.36, spec: 'Canto inferior anti-impacto', source: 'Manuscritos 09-17' },
  { code: 'INS-CON-BOX', name: 'Conector Metálico de Box 13cm', category: 'Acessórios de Box e Baú', unit: 'UN', cost: 1.06, spec: 'União para bipartidos Queen e King', source: 'Manuscritos 09-17' },
  { code: 'INS-ART-BAU', name: 'Kit Articulação de Baú (Par)', category: 'Acessórios de Box e Baú', unit: 'PAR', cost: 72, spec: 'Par de ferragens pantográficas', source: 'Manuscritos 13-16' },
  { code: 'INS-PIS-650', name: 'Pistão a Gás 650N Baú', category: 'Acessórios de Box e Baú', unit: 'UN', cost: 35, spec: 'Amortecedor de elevação 650 Newtons', source: 'Manuscritos 13-16' },
  { code: 'INS-PUX-BAU', name: 'Puxador de Baú em Fita', category: 'Acessórios de Box e Baú', unit: 'UN', cost: 0.85, spec: 'Fita puxadora de abertura', source: 'Manuscritos 13-16' },
  { code: 'INS-ARC-CRO', name: 'Arco Retentor Cromado de Colchão', category: 'Acessórios de Box e Baú', unit: 'UN', cost: 5.18, spec: 'Aparador metálico frontal do baú', source: 'Manuscritos 13-16' },
  { code: 'INS-CHA-UNI', name: 'Chapa União do Tampo Baú', category: 'Acessórios de Box e Baú', unit: 'UN', cost: 2.6, spec: 'Placa metálica de fixação do tampo', source: 'Manuscritos 13-16' },
  { code: 'INS-COL-CON', name: 'Cola de Contato Adesiva', category: 'Aviamentos e Químicos', unit: 'KG', cost: 21, spec: 'Adesivo de contato p/ espuma e tecido', source: 'Manuscrito 04' },
  { code: 'INS-FIT-035', name: 'Fitim de Debrum 035mm Fechamento', category: 'Aviamentos e Químicos', unit: 'M', cost: 0.6, spec: 'Fita de fechamento para máquina debrum', source: 'Manuscrito 04' },
  { code: 'INS-FIT-COL', name: 'Fitim Colméia Especial', category: 'Aviamentos e Químicos', unit: 'M', cost: 0.23, spec: 'Preto, Marrom, Cinza, Branco', source: 'Manuscrito 05-08' },
  { code: 'INS-LIN-060', name: 'Linha 60 p/ Fechamento Colchão', category: 'Aviamentos e Químicos', unit: 'ROLO', cost: 18, spec: 'Linha de nylon tenacidade fechadeira', source: 'Manuscrito 01/07' },
  { code: 'INS-LIN-120', name: 'Linha 120 p/ Costura Reta', category: 'Aviamentos e Químicos', unit: 'ROLO', cost: 12, spec: 'Linha de costura reta faixas e vivos', source: 'Manuscrito 01/07' },
  { code: 'INS-EMB-PLA', name: 'Plástico Tubular Embalagem 1,90m', category: 'Embalagem', unit: 'KG', cost: 22, spec: 'Filme plástico tubular protetor', source: 'Manuscrito 04' },
  { code: 'INS-KIT-VIB', name: 'Kit Vibromassagem c/ Controle', category: 'Terapêutico', unit: 'UN', cost: 790, spec: 'Sistema eletrônico de massagem 8 motores', source: 'Manuscritos 28-35' },
  { code: 'INS-POR-VIB', name: 'Porta Kit Vibromassagem em Veludo', category: 'Terapêutico', unit: 'UN', cost: 20, spec: 'Bolso lateral costurado p/ controle', source: 'Manuscritos 28-35' }
];

// ==========================================
// 2. DADOS DE PRODUTOS (40 PRODUTOS E SERVIÇOS)
// ==========================================
const PRODUTOS = [
  { code: 'REF-COL-SOL', name: 'Reforma Só Colchão Solteiro 0,88 x 1,88', type: 'SERVICO', line: 'Reforma Colchão', size: 'Solteiro', l: 1.88, w: 0.88, h: 0.25, cost: 205.6, source: 'Manuscrito 05' },
  { code: 'REF-COL-CAS', name: 'Reforma Só Colchão Casal 1,38 x 1,88', type: 'SERVICO', line: 'Reforma Colchão', size: 'Casal', l: 1.88, w: 1.38, h: 0.25, cost: 308.6, source: 'Manuscrito 06' },
  { code: 'REF-COL-QUE', name: 'Reforma Só Colchão Queen 1,58 x 1,98', type: 'SERVICO', line: 'Reforma Colchão', size: 'Queen', l: 1.98, w: 1.58, h: 0.25, cost: 360.03, source: 'Manuscrito 12' },
  { code: 'REF-COL-KIN', name: 'Reforma Só Colchão King 1,93 x 2,03', type: 'SERVICO', line: 'Reforma Colchão', size: 'King', l: 2.03, w: 1.93, h: 0.25, cost: 438.41, source: 'Manuscrito 08' },
  { code: 'REF-BOX-SOL', name: 'Reforma Só Box Solteiro 0,88 x 1,88', type: 'SERVICO', line: 'Reforma Box', size: 'Solteiro', l: 1.88, w: 0.88, h: 0.3, cost: 28.63, source: 'Manuscrito 05' },
  { code: 'REF-BOX-CAS', name: 'Reforma Só Box Casal 1,38 x 1,88', type: 'SERVICO', line: 'Reforma Box', size: 'Casal', l: 1.88, w: 1.38, h: 0.3, cost: 32.54, source: 'Manuscrito 06' },
  { code: 'REF-BOX-QUE', name: 'Reforma Só Box Queen 1,58 x 1,98', type: 'SERVICO', line: 'Reforma Box', size: 'Queen', l: 1.98, w: 1.58, h: 0.3, cost: 48.61, source: 'Manuscrito 12' },
  { code: 'REF-BOX-KIN', name: 'Reforma Só Box King 1,93 x 2,03', type: 'SERVICO', line: 'Reforma Box', size: 'King', l: 2.03, w: 1.93, h: 0.3, cost: 52.49, source: 'Manuscrito 08' },
  { code: 'REF-CJT-SOL', name: 'Reforma Conjunto Solteiro 0,88 x 1,88 (Colchão + Box)', type: 'SERVICO', line: 'Reforma Conjunto', size: 'Solteiro', l: 1.88, w: 0.88, h: 0.55, cost: 234.22, source: 'Manuscrito 05' },
  { code: 'REF-CJT-CAS', name: 'Reforma Conjunto Casal 1,38 x 1,88 (Colchão + Box)', type: 'SERVICO', line: 'Reforma Conjunto', size: 'Casal', l: 1.88, w: 1.38, h: 0.55, cost: 341.14, source: 'Manuscrito 06' },
  { code: 'REF-CJT-QUE', name: 'Reforma Conjunto Queen 1,58 x 1,98 (Colchão + Box)', type: 'SERVICO', line: 'Reforma Conjunto', size: 'Queen', l: 1.98, w: 1.58, h: 0.55, cost: 408.63, source: 'Manuscrito 12' },
  { code: 'REF-CJT-KIN', name: 'Reforma Conjunto King 1,93 x 2,03 (Colchão + Box)', type: 'SERVICO', line: 'Reforma Conjunto', size: 'King', l: 2.03, w: 1.93, h: 0.55, cost: 490.9, source: 'Manuscrito 08' },
  { code: 'REF-COL-100-1L', name: 'Reforma Colchão 1,00 x 2,03 (Espuma 1 Lado 5cm)', type: 'SERVICO', line: 'Reforma Colchão', size: 'Especial', l: 2.03, w: 1, h: 0.25, cost: 248, source: 'Manuscrito 18' },
  { code: 'REF-COL-100-2L', name: 'Reforma Colchão 1,00 x 2,03 (Espuma 2 Lados 5cm)', type: 'SERVICO', line: 'Reforma Colchão', size: 'Especial', l: 2.03, w: 1, h: 0.3, cost: 346.7, source: 'Manuscrito 18' },
  { code: 'REF-BOX-100', name: 'Reforma Box 1,00 x 2,03', type: 'SERVICO', line: 'Reforma Box', size: 'Especial', l: 2.03, w: 1, h: 0.3, cost: 101.65, source: 'Manuscrito 21' },
  { code: 'PIL-TOP-205', name: 'Pilow Top 2,05 x 2,05 x 0,03', type: 'PRODUTO', line: 'Pilow Top', size: 'Especial', l: 2.05, w: 2.05, h: 0.03, cost: 383, source: 'Manuscrito 19' },
  { code: 'BOX-LIF-SOL', name: 'Box Life MDF Solteiro 88 x 188', type: 'PRODUTO', line: 'Box Life MDF', size: 'Solteiro', l: 1.88, w: 0.88, h: 0.3, cost: 145.69, source: 'Manuscrito 09' },
  { code: 'BOX-LIF-CAS', name: 'Box Life MDF Casal 138 x 188', type: 'PRODUTO', line: 'Box Life MDF', size: 'Casal', l: 1.88, w: 1.38, h: 0.3, cost: 191.38, source: 'Manuscrito 10' },
  { code: 'BOX-LIF-QUE', name: 'Box Life MDF Queen 158 x 198 (Bipartido)', type: 'PRODUTO', line: 'Box Life MDF', size: 'Queen', l: 1.98, w: 1.58, h: 0.3, cost: 283.33, source: 'Manuscrito 11' },
  { code: 'BOX-LIF-KIN', name: 'Box Life MDF King 193 x 203 (Bipartido)', type: 'PRODUTO', line: 'Box Life MDF', size: 'King', l: 2.03, w: 1.93, h: 0.3, cost: 310.87, source: 'Manuscrito 17' },
  { code: 'BAU-SIE-SOL', name: 'Box Baú Sienna Solteiro 88 x 188 c/ Pistões', type: 'PRODUTO', line: 'Box Baú Sienna', size: 'Solteiro', l: 1.88, w: 0.88, h: 0.4, cost: 464.04, source: 'Manuscrito 13' },
  { code: 'BAU-SIE-CAS', name: 'Box Baú Sienna Casal 138 x 188 c/ Pistões', type: 'PRODUTO', line: 'Box Baú Sienna', size: 'Casal', l: 1.88, w: 1.38, h: 0.4, cost: 575.46, source: 'Manuscrito 14' },
  { code: 'BAU-SIE-QUE', name: 'Box Baú Sienna Queen 158 x 198 c/ Pistões (Bipartido)', type: 'PRODUTO', line: 'Box Baú Sienna', size: 'Queen', l: 1.98, w: 1.58, h: 0.4, cost: 949.08, source: 'Manuscrito 15' },
  { code: 'BAU-SIE-KIN', name: 'Box Baú Sienna King 193 x 203 c/ Pistões (Bipartido)', type: 'PRODUTO', line: 'Box Baú Sienna', size: 'King', l: 2.03, w: 1.93, h: 0.4, cost: 1075.83, source: 'Manuscrito 16' },
  { code: 'BOX-LEV-SOL', name: 'Box Spá Levitá Solteiro 88 x 188', type: 'PRODUTO', line: 'Box Spá Levitá', size: 'Solteiro', l: 1.88, w: 0.88, h: 0.28, cost: 197, source: 'Manuscrito 32' },
  { code: 'BOX-LEV-CAS', name: 'Box Spá Levitá Casal 138 x 188', type: 'PRODUTO', line: 'Box Spá Levitá', size: 'Casal', l: 1.88, w: 1.38, h: 0.28, cost: 218, source: 'Manuscrito 33' },
  { code: 'BOX-LEV-QUE', name: 'Box Spá Levitá Queen 158 x 198', type: 'PRODUTO', line: 'Box Spá Levitá', size: 'Queen', l: 1.98, w: 1.58, h: 0.28, cost: 245.65, source: 'Manuscrito 34' },
  { code: 'BOX-LEV-KIN', name: 'Box Spá Levitá King 193 x 203', type: 'PRODUTO', line: 'Box Spá Levitá', size: 'King', l: 2.03, w: 1.93, h: 0.28, cost: 388.3, source: 'Manuscrito 36' },
  { code: 'COL-ESS-SOL', name: 'Colchão SPA Essencial Solteiro 88 x 188 x 25 (Bonnel)', type: 'PRODUTO', line: 'Colchão SPA Essencial', size: 'Solteiro', l: 1.88, w: 0.88, h: 0.25, cost: 382.25, source: 'Manuscrito 20' },
  { code: 'COL-ESS-CAS', name: 'Colchão SPA Essencial Casal 138 x 188 x 25 (Bonnel)', type: 'PRODUTO', line: 'Colchão SPA Essencial', size: 'Casal', l: 1.88, w: 1.38, h: 0.25, cost: 556.83, source: 'Manuscrito 26' },
  { code: 'COL-ESS-QUE', name: 'Colchão SPA Essencial Queen 158 x 198 x 25 (Bonnel)', type: 'PRODUTO', line: 'Colchão SPA Essencial', size: 'Queen', l: 1.98, w: 1.58, h: 0.25, cost: 655.15, source: 'Manuscrito 22' },
  { code: 'COL-ESS-KIN', name: 'Colchão SPA Essencial King 193 x 203 x 25 (Bonnel)', type: 'PRODUTO', line: 'Colchão SPA Essencial', size: 'King', l: 2.03, w: 1.93, h: 0.25, cost: 797, source: 'Manuscrito 23' },
  { code: 'COL-SUP-SOL', name: 'Colchão SPA Supreme Solteiro 88 x 188 (Pocket Pillow)', type: 'PRODUTO', line: 'Colchão SPA Supreme', size: 'Solteiro', l: 1.88, w: 0.88, h: 0.3, cost: 615, source: 'Manuscrito 24' },
  { code: 'COL-SUP-CAS', name: 'Colchão SPA Supreme Casal 138 x 188 (Pocket Pillow)', type: 'PRODUTO', line: 'Colchão SPA Supreme', size: 'Casal', l: 1.88, w: 1.38, h: 0.3, cost: 926, source: 'Manuscrito 25' },
  { code: 'COL-SUP-QUE', name: 'Colchão SPA Supreme Queen 158 x 198 (Pocket Pillow)', type: 'PRODUTO', line: 'Colchão SPA Supreme', size: 'Queen', l: 1.98, w: 1.58, h: 0.3, cost: 1083, source: 'Manuscrito 31' },
  { code: 'COL-SUP-KIN', name: 'Colchão SPA Supreme King 193 x 203 (Pocket Pillow)', type: 'PRODUTO', line: 'Colchão SPA Supreme', size: 'King', l: 2.03, w: 1.93, h: 0.3, cost: 1326.4, source: 'Manuscrito 27' },
  { code: 'COL-MAG-SOL', name: 'Colchão SPA Magnus Solteiro 88 x 188 x 32 (Vibro/Ímãs)', type: 'PRODUTO', line: 'Colchão SPA Magnus', size: 'Solteiro', l: 1.88, w: 0.88, h: 0.32, cost: 1426, source: 'Manuscrito 28' },
  { code: 'COL-MAG-CAS', name: 'Colchão SPA Magnus Casal 138 x 188 x 32 (Vibro/Ímãs)', type: 'PRODUTO', line: 'Colchão SPA Magnus', size: 'Casal', l: 1.88, w: 1.38, h: 0.32, cost: 1751.6, source: 'Manuscrito 29' },
  { code: 'COL-MAG-QUE', name: 'Colchão SPA Magnus Queen 158 x 198 x 32 (Vibro/Ímãs)', type: 'PRODUTO', line: 'Colchão SPA Magnus', size: 'Queen', l: 1.98, w: 1.58, h: 0.32, cost: 1903.6, source: 'Manuscrito 30' },
  { code: 'COL-MAG-KIN', name: 'Colchão SPA Magnus King 193 x 203 x 32 (Vibro/Ímãs)', type: 'PRODUTO', line: 'Colchão SPA Magnus', size: 'King', l: 2.03, w: 1.93, h: 0.32, cost: 2150, source: 'Manuscrito 35' }
];

// ==========================================
// 3. FICHAS TÉCNICAS (BOM - BILL OF MATERIALS)
// ==========================================
// Mapeamento explícito fornecido no CSV
const EXPLICIT_BOM = {
  'REF-COL-SOL': [
    { code: 'INS-TEC-MAT', qty: 1.9, unit: 'M', step: 'Tapeçaria Tampo' },
    { code: 'INS-FIT-COL', qty: 16.8, unit: 'M', step: 'Fechamento Debrum' },
    { code: 'INS-ESP-R26-5CM', qty: 0.08404, unit: 'M3', step: 'Espumação Conforto' },
    { code: 'INS-TEC-VEL', qty: 1.3, unit: 'M', step: 'Costura Faixa' },
    { code: 'INS-TNT-040', qty: 1.95, unit: 'M', step: 'Forração Matelassê' },
    { code: 'INS-COL-CON', qty: 0.1, unit: 'KG', step: 'Colagem Espuma' }
  ],
  'REF-BOX-SOL': [
    { code: 'INS-TEC-VEL', qty: 1.35, unit: 'M', step: 'Tapeçaria Faixa Box' },
    { code: 'INS-TNT-080', qty: 1.95, unit: 'M', step: 'Tampo Antiderrapante' },
    { code: 'INS-GRA-8008', qty: 250, unit: 'UN', step: 'Tapeçaria Fixação' },
    { code: 'INS-GRA-1438', qty: 100, unit: 'UN', step: 'Reforço Estrutural' }
  ],
  'REF-CJT-SOL': [
    { code: 'INS-TEC-MAT', qty: 1.9, unit: 'M', step: 'Colchão - Tampo' },
    { code: 'INS-FIT-COL', qty: 16.8, unit: 'M', step: 'Colchão - Debrum' },
    { code: 'INS-ESP-R26-5CM', qty: 0.08404, unit: 'M3', step: 'Colchão - Conforto' },
    { code: 'INS-TEC-VEL', qty: 2.65, unit: 'M', step: 'Colchão + Box Faixas' },
    { code: 'INS-TNT-040', qty: 1.95, unit: 'M', step: 'Colchão - Forro' },
    { code: 'INS-TNT-080', qty: 1.95, unit: 'M', step: 'Box - Tampo' },
    { code: 'INS-GRA-8008', qty: 250, unit: 'UN', step: 'Box - Tapeçaria' },
    { code: 'INS-COL-CON', qty: 0.1, unit: 'KG', step: 'Colchão - Cola' },
    { code: 'INS-GRA-1438', qty: 100, unit: 'UN', step: 'Box - Estrutura' }
  ],
  'REF-COL-CAS': [
    { code: 'INS-TEC-MAT', qty: 2.9, unit: 'M', step: 'Tapeçaria Tampo' },
    { code: 'INS-FIT-COL', qty: 19.8, unit: 'M', step: 'Fechamento Debrum' },
    { code: 'INS-ESP-R26-5CM', qty: 0.13179, unit: 'M3', step: 'Espumação Conforto' },
    { code: 'INS-TEC-VEL', qty: 1.55, unit: 'M', step: 'Costura Faixa' },
    { code: 'INS-TNT-040', qty: 1.95, unit: 'M', step: 'Forração Matelassê' },
    { code: 'INS-COL-CON', qty: 0.13, unit: 'KG', step: 'Colagem Espuma' }
  ],
  'REF-BOX-CAS': [
    { code: 'INS-TEC-VEL', qty: 1.6, unit: 'M', step: 'Tapeçaria Faixa Box' },
    { code: 'INS-TNT-080', qty: 1.95, unit: 'M', step: 'Tampo Antiderrapante' },
    { code: 'INS-GRA-8008', qty: 375, unit: 'UN', step: 'Tapeçaria Fixação' },
    { code: 'INS-GRA-1438', qty: 130, unit: 'UN', step: 'Reforço Estrutural' }
  ],
  'REF-COL-QUE': [
    { code: 'INS-TEC-MAT', qty: 3.3, unit: 'M', step: 'Tapeçaria Tampo' },
    { code: 'INS-FIT-COL', qty: 21.6, unit: 'M', step: 'Fechamento Debrum' },
    { code: 'INS-ESP-R26-5CM', qty: 0.15642, unit: 'M3', step: 'Espumação Conforto' },
    { code: 'INS-TEC-VEL', qty: 1.7, unit: 'M', step: 'Costura Faixa' },
    { code: 'INS-TNT-040', qty: 4.1, unit: 'M', step: 'Forração Matelassê' },
    { code: 'INS-COL-CON', qty: 0.17, unit: 'KG', step: 'Colagem Espuma' }
  ],
  'REF-BOX-QUE': [
    { code: 'INS-TEC-VEL', qty: 1.75, unit: 'M', step: 'Tapeçaria Faixa Box' },
    { code: 'INS-TNT-080', qty: 4.1, unit: 'M', step: 'Tampo Antiderrapante' },
    { code: 'INS-GRA-8008', qty: 500, unit: 'UN', step: 'Tapeçaria Fixação' },
    { code: 'INS-GRA-1438', qty: 230, unit: 'UN', step: 'Reforço Estrutural' }
  ],
  'REF-COL-KIN': [
    { code: 'INS-TEC-MAT', qty: 4, unit: 'M', step: 'Tapeçaria Tampo' },
    { code: 'INS-FIT-COL', qty: 24, unit: 'M', step: 'Fechamento Debrum' },
    { code: 'INS-ESP-R26-5CM', qty: 0.195895, unit: 'M3', step: 'Espumação Conforto' },
    { code: 'INS-TEC-VEL', qty: 1.9, unit: 'M', step: 'Costura Faixa' },
    { code: 'INS-TNT-040', qty: 4.2, unit: 'M', step: 'Forração Matelassê' },
    { code: 'INS-COL-CON', qty: 0.2, unit: 'KG', step: 'Colagem Espuma' }
  ],
  'REF-BOX-KIN': [
    { code: 'INS-TEC-VEL', qty: 1.95, unit: 'M', step: 'Tapeçaria Faixa Box' },
    { code: 'INS-TNT-080', qty: 4.2, unit: 'M', step: 'Tampo Antiderrapante' },
    { code: 'INS-GRA-8008', qty: 550, unit: 'UN', step: 'Tapeçaria Fixação' },
    { code: 'INS-GRA-1438', qty: 270, unit: 'UN', step: 'Reforço Estrutural' }
  ],
  'BOX-LIF-SOL': [
    { code: 'INS-BUC-516', qty: 6, unit: 'UN', step: 'Estrutura Pés' },
    { code: 'INS-CAN-PLA', qty: 4, unit: 'UN', step: 'Cantos Acabamento' },
    { code: 'INS-MDF-004', qty: 1.6544, unit: 'M2', step: 'Chapa Tampo' },
    { code: 'INS-MDF-015', qty: 1.4905, unit: 'M2', step: 'Chapa Lateral' },
    { code: 'INS-EMB-PLA', qty: 0.33, unit: 'KG', step: 'Embalagem Final' },
    { code: 'INS-GRA-1438', qty: 250, unit: 'UN', step: 'Armação Madeira' },
    { code: 'INS-GRA-8008', qty: 250, unit: 'UN', step: 'Tapeçaria Veludo' },
    { code: 'INS-GRA-9230', qty: 250, unit: 'UN', step: 'Fixação MDF' },
    { code: 'INS-MAD-001', qty: 0.01375, unit: 'M3', step: 'Estrutura Madeira' },
    { code: 'INS-PE-PLA-12', qty: 6, unit: 'UN', step: 'Montagem Pés' },
    { code: 'INS-TEC-VEL', qty: 1.4, unit: 'M', step: 'Tapeçaria Faixa' },
    { code: 'INS-TNT-040', qty: 1.95, unit: 'M', step: 'Forro Inferior' },
    { code: 'INS-TNT-080', qty: 1.95, unit: 'M', step: 'Tampo Superior' }
  ],
  'BAU-SIE-SOL': [
    { code: 'INS-BUC-516', qty: 6, unit: 'UN', step: 'Estrutura Pés' },
    { code: 'INS-CAN-PLA', qty: 4, unit: 'UN', step: 'Cantos Acabamento' },
    { code: 'INS-MDF-004', qty: 3.3088, unit: 'M2', step: 'Chapa Tampo/Fundo' },
    { code: 'INS-MDF-006', qty: 1.8768, unit: 'M2', step: 'Chapa Lateral' },
    { code: 'INS-EMB-PLA', qty: 0.28, unit: 'KG', step: 'Embalagem Final' },
    { code: 'INS-ESP-R26-1CM', qty: 0.0167, unit: 'M3', step: 'Acolchoamento' },
    { code: 'INS-GRA-1438', qty: 430, unit: 'UN', step: 'Armação Madeira' },
    { code: 'INS-GRA-8008', qty: 660, unit: 'UN', step: 'Tapeçaria Veludo' },
    { code: 'INS-GRA-9230', qty: 280, unit: 'UN', step: 'Fixação MDF' },
    { code: 'INS-ART-BAU', qty: 1, unit: 'PAR', step: 'Mecanismo Articulação' },
    { code: 'INS-PAR-6025', qty: 16, unit: 'UN', step: 'Fixação Articulação' },
    { code: 'INS-MAD-002', qty: 0.04861, unit: 'M3', step: 'Estrutura Madeira' },
    { code: 'INS-PE-PLA-06', qty: 6, unit: 'UN', step: 'Montagem Pés' },
    { code: 'INS-PUX-BAU', qty: 1, unit: 'UN', step: 'Puxador' },
    { code: 'INS-ARC-CRO', qty: 1, unit: 'UN', step: 'Arco Retentor' },
    { code: 'INS-TEC-VEL', qty: 3.4, unit: 'M', step: 'Tapeçaria Faixa' },
    { code: 'INS-PIS-650', qty: 2, unit: 'UN', step: 'Pistões Pressurizados' },
    { code: 'INS-TNT-080', qty: 7.8, unit: 'M', step: 'Forração Interna/Tampo' }
  ],
  'COL-ESS-SOL': [
    { code: 'INS-MOL-BON-SOL', qty: 1, unit: 'UN', step: 'Armação Molejo' },
    { code: 'INS-FEL-RES', qty: 3.7, unit: 'M2', step: 'Isolamento Molas' },
    { code: 'INS-ESP-D28', qty: 0.08492, unit: 'M3', step: 'Espumação Superior 5cm' },
    { code: 'INS-ESP-D28', qty: 0.05095, unit: 'M3', step: 'Espumação Inferior 3cm' },
    { code: 'INS-ESP-D28', qty: 0.05502, unit: 'M3', step: 'Borda Perimetral' },
    { code: 'INS-COL-CON', qty: 0.2, unit: 'KG', step: 'Colagem Geral' },
    { code: 'INS-TEC-VEL', qty: 1.2, unit: 'M', step: 'Faixa Lateral 30cm' },
    { code: 'INS-TEC-MAT', qty: 0.95, unit: 'M', step: 'Tampo Matelassê' },
    { code: 'INS-FIT-035', qty: 16.8, unit: 'M', step: 'Fechamento Debrum' },
    { code: 'INS-EMB-PLA', qty: 0.5, unit: 'KG', step: 'Embalagem Final' },
    { code: 'INS-TNT-080', qty: 1.95, unit: 'M', step: 'Fundo Parte Baixo' }
  ],
  'COL-SUP-SOL': [
    { code: 'INS-MOL-POC-SOL', qty: 1, unit: 'UN', step: 'Armação Molejo' },
    { code: 'INS-FEL-RES', qty: 3.7, unit: 'M2', step: 'Isolamento Molas' },
    { code: 'INS-ESP-D28', qty: 0.16984, unit: 'M3', step: 'Pillow Pastel 2x5cm' },
    { code: 'INS-ESP-D28', qty: 0.10032, unit: 'M3', step: 'Base Pillow 2x3cm' },
    { code: 'INS-ESP-D28', qty: 0.05502, unit: 'M3', step: 'Borda Perimetral' },
    { code: 'INS-COL-CON', qty: 0.3, unit: 'KG', step: 'Colagem Geral' },
    { code: 'INS-TEC-VEL', qty: 2.2, unit: 'M', step: 'Faixa Lateral 54cm' },
    { code: 'INS-TEC-MAT', qty: 1.9, unit: 'M', step: 'Tampo Matelassê' },
    { code: 'INS-FIT-035', qty: 22.4, unit: 'M', step: 'Fechamento Debrum' },
    { code: 'INS-EMB-PLA', qty: 0.5, unit: 'KG', step: 'Embalagem Final' }
  ],
  'COL-MAG-SOL': [
    { code: 'INS-EPS-307', qty: 0.23184, unit: 'M3', step: 'Núcleo Isopor EPS' },
    { code: 'INS-MDF-003', qty: 3.3088, unit: 'M2', step: 'Chapa Sustentação' },
    { code: 'INS-ESP-D28', qty: 0.16212, unit: 'M3', step: 'Espuma Tampo 2x5cm' },
    { code: 'INS-ESP-D28', qty: 0.03242, unit: 'M3', step: 'Espuma Fundo 2cm' },
    { code: 'INS-ESP-D28', qty: 0.03584, unit: 'M3', step: 'Espuma Faixa 32cm' },
    { code: 'INS-RAB-001', qty: 1, unit: 'UN', step: 'Rabatan Massagem' },
    { code: 'INS-KIT-VIB', qty: 1, unit: 'UN', step: 'Kit Vibromassagem' },
    { code: 'INS-POR-VIB', qty: 1, unit: 'UN', step: 'Bolso Porta Controle' },
    { code: 'INS-FIT-035', qty: 16.8, unit: 'M', step: 'Fechamento Debrum' },
    { code: 'INS-COL-CON', qty: 0.3, unit: 'KG', step: 'Colagem Geral' },
    { code: 'INS-TEC-MAT', qty: 1.9, unit: 'M', step: 'Tampo Matelassê' },
    { code: 'INS-TEC-VEL', qty: 1.6, unit: 'M', step: 'Faixa Veludo 40cm' },
    { code: 'INS-EMB-PLA', qty: 0.5, unit: 'KG', step: 'Embalagem Final' }
  ]
};

// Gerador de BOM para os produtos que não têm tabela explícita individual no CSV
function getBOMForProduct(prod) {
  if (EXPLICIT_BOM[prod.code]) {
    return EXPLICIT_BOM[prod.code];
  }

  // 1. Conjuntos de Reforma (Colchão + Box)
  if (prod.code === 'REF-CJT-CAS') {
    return [
      { code: 'INS-TEC-MAT', qty: 2.9, unit: 'M', step: 'Colchão - Tampo' },
      { code: 'INS-FIT-COL', qty: 19.8, unit: 'M', step: 'Colchão - Debrum' },
      { code: 'INS-ESP-R26-5CM', qty: 0.13179, unit: 'M3', step: 'Colchão - Conforto' },
      { code: 'INS-TEC-VEL', qty: 3.15, unit: 'M', step: 'Colchão + Box Faixas' },
      { code: 'INS-TNT-040', qty: 1.95, unit: 'M', step: 'Colchão - Forro' },
      { code: 'INS-TNT-080', qty: 1.95, unit: 'M', step: 'Box - Tampo' },
      { code: 'INS-GRA-8008', qty: 375, unit: 'UN', step: 'Box - Tapeçaria' },
      { code: 'INS-COL-CON', qty: 0.13, unit: 'KG', step: 'Colchão - Cola' },
      { code: 'INS-GRA-1438', qty: 130, unit: 'UN', step: 'Box - Estrutura' }
    ];
  }
  if (prod.code === 'REF-CJT-QUE') {
    return [
      { code: 'INS-TEC-MAT', qty: 3.3, unit: 'M', step: 'Colchão - Tampo' },
      { code: 'INS-FIT-COL', qty: 21.6, unit: 'M', step: 'Colchão - Debrum' },
      { code: 'INS-ESP-R26-5CM', qty: 0.15642, unit: 'M3', step: 'Colchão - Conforto' },
      { code: 'INS-TEC-VEL', qty: 3.45, unit: 'M', step: 'Colchão + Box Faixas' },
      { code: 'INS-TNT-040', qty: 4.1, unit: 'M', step: 'Colchão - Forro' },
      { code: 'INS-TNT-080', qty: 4.1, unit: 'M', step: 'Box - Tampo' },
      { code: 'INS-GRA-8008', qty: 500, unit: 'UN', step: 'Box - Tapeçaria' },
      { code: 'INS-COL-CON', qty: 0.17, unit: 'KG', step: 'Colchão - Cola' },
      { code: 'INS-GRA-1438', qty: 230, unit: 'UN', step: 'Box - Estrutura' }
    ];
  }
  if (prod.code === 'REF-CJT-KIN') {
    return [
      { code: 'INS-TEC-MAT', qty: 4, unit: 'M', step: 'Colchão - Tampo' },
      { code: 'INS-FIT-COL', qty: 24, unit: 'M', step: 'Colchão - Debrum' },
      { code: 'INS-ESP-R26-5CM', qty: 0.195895, unit: 'M3', step: 'Colchão - Conforto' },
      { code: 'INS-TEC-VEL', qty: 3.85, unit: 'M', step: 'Colchão + Box Faixas' },
      { code: 'INS-TNT-040', qty: 4.2, unit: 'M', step: 'Colchão - Forro' },
      { code: 'INS-TNT-080', qty: 4.2, unit: 'M', step: 'Box - Tampo' },
      { code: 'INS-GRA-8008', qty: 550, unit: 'UN', step: 'Box - Tapeçaria' },
      { code: 'INS-COL-CON', qty: 0.2, unit: 'KG', step: 'Colchão - Cola' },
      { code: 'INS-GRA-1438', qty: 270, unit: 'UN', step: 'Box - Estrutura' }
    ];
  }

  // 2. Medidas Especiais Reforma
  if (prod.code === 'REF-COL-100-1L') {
    return [
      { code: 'INS-TEC-MAT', qty: 2.1, unit: 'M', step: 'Tapeçaria Tampo' },
      { code: 'INS-FIT-COL', qty: 18.0, unit: 'M', step: 'Fechamento Debrum' },
      { code: 'INS-ESP-R26-5CM', qty: 0.1015, unit: 'M3', step: 'Espuma 1 Lado 5cm' },
      { code: 'INS-TEC-VEL', qty: 1.4, unit: 'M', step: 'Costura Faixa' },
      { code: 'INS-TNT-040', qty: 2.1, unit: 'M', step: 'Forração Matelassê' },
      { code: 'INS-COL-CON', qty: 0.12, unit: 'KG', step: 'Colagem Espuma' }
    ];
  }
  if (prod.code === 'REF-COL-100-2L') {
    return [
      { code: 'INS-TEC-MAT', qty: 2.1, unit: 'M', step: 'Tapeçaria Tampo' },
      { code: 'INS-FIT-COL', qty: 18.0, unit: 'M', step: 'Fechamento Debrum' },
      { code: 'INS-ESP-R26-5CM', qty: 0.203, unit: 'M3', step: 'Espuma 2 Lados 5cm' },
      { code: 'INS-TEC-VEL', qty: 1.5, unit: 'M', step: 'Costura Faixa' },
      { code: 'INS-TNT-040', qty: 2.1, unit: 'M', step: 'Forração Matelassê' },
      { code: 'INS-COL-CON', qty: 0.2, unit: 'KG', step: 'Colagem Espuma' }
    ];
  }
  if (prod.code === 'REF-BOX-100') {
    return [
      { code: 'INS-TEC-VEL', qty: 1.5, unit: 'M', step: 'Tapeçaria Faixa Box' },
      { code: 'INS-TNT-080', qty: 2.1, unit: 'M', step: 'Tampo Antiderrapante' },
      { code: 'INS-GRA-8008', qty: 300, unit: 'UN', step: 'Tapeçaria Fixação' },
      { code: 'INS-GRA-1438', qty: 120, unit: 'UN', step: 'Reforço Estrutural' },
      { code: 'INS-PE-PLA-12', qty: 6, unit: 'UN', step: 'Pés Estruturais' }
    ];
  }
  if (prod.code === 'PIL-TOP-205') {
    return [
      { code: 'INS-TEC-MAT', qty: 4.5, unit: 'M', step: 'Matelassê Duplo' },
      { code: 'INS-ESP-D28', qty: 0.126, unit: 'M3', step: 'Lâmina Conforto D-28 3cm' },
      { code: 'INS-TEC-VEL', qty: 1.8, unit: 'M', step: 'Faixa Lateral' },
      { code: 'INS-FIT-035', qty: 25.0, unit: 'M', step: 'Fechamento Debrum' },
      { code: 'INS-COL-CON', qty: 0.25, unit: 'KG', step: 'Colagem' }
    ];
  }

  // 3. Colchão Essencial Bonnel (Casal, Queen, King)
  if (prod.code.startsWith('COL-ESS-')) {
    const sizeMap = {
      'CAS': { mol: 'INS-MOL-BON-CAS', feltro: 5.5, d28_sup: 0.125, d28_inf: 0.075, d28_bor: 0.065, vel: 1.5, mat: 1.45, fit: 19.8, emb: 0.7, tnt: 2.9 },
      'QUE': { mol: 'INS-MOL-BON-QUE', feltro: 6.5, d28_sup: 0.155, d28_inf: 0.095, d28_bor: 0.075, vel: 1.7, mat: 1.65, fit: 21.6, emb: 0.8, tnt: 3.3 },
      'KIN': { mol: 'INS-MOL-BON-KIN', feltro: 7.8, d28_sup: 0.195, d28_inf: 0.115, d28_bor: 0.085, vel: 1.9, mat: 2.05, fit: 24.0, emb: 1.0, tnt: 4.0 }
    };
    const s = sizeMap[prod.code.split('-')[2]] || sizeMap['CAS'];
    return [
      { code: s.mol, qty: 1, unit: 'UN', step: 'Armação Molejo Bonnel' },
      { code: 'INS-FEL-RES', qty: s.feltro, unit: 'M2', step: 'Isolamento Molas' },
      { code: 'INS-ESP-D28', qty: s.d28_sup, unit: 'M3', step: 'Espumação Superior 5cm' },
      { code: 'INS-ESP-D28', qty: s.d28_inf, unit: 'M3', step: 'Espumação Inferior 3cm' },
      { code: 'INS-ESP-D28', qty: s.d28_bor, unit: 'M3', step: 'Borda Perimetral' },
      { code: 'INS-COL-CON', qty: 0.25, unit: 'KG', step: 'Colagem Geral' },
      { code: 'INS-TEC-VEL', qty: s.vel, unit: 'M', step: 'Faixa Lateral 30cm' },
      { code: 'INS-TEC-MAT', qty: s.mat, unit: 'M', step: 'Tampo Matelassê' },
      { code: 'INS-FIT-035', qty: s.fit, unit: 'M', step: 'Fechamento Debrum' },
      { code: 'INS-EMB-PLA', qty: s.emb, unit: 'KG', step: 'Embalagem Final' },
      { code: 'INS-TNT-080', qty: s.tnt, unit: 'M', step: 'Fundo Parte Baixo' }
    ];
  }

  // 4. Colchão Supreme Pocket (Casal, Queen, King)
  if (prod.code.startsWith('COL-SUP-')) {
    const sizeMap = {
      'CAS': { mol: 'INS-MOL-POC-CAS', feltro: 5.5, d28_pil: 0.265, d28_bas: 0.155, d28_bor: 0.065, vel: 2.6, mat: 2.9, fit: 26.0, emb: 0.7 },
      'QUE': { mol: 'INS-MOL-POC-QUE', feltro: 6.5, d28_pil: 0.315, d28_bas: 0.185, d28_bor: 0.075, vel: 2.9, mat: 3.3, fit: 28.0, emb: 0.8 },
      'KIN': { mol: 'INS-MOL-POC-KIN', feltro: 7.8, d28_pil: 0.395, d28_bas: 0.235, d28_bor: 0.085, vel: 3.3, mat: 4.0, fit: 31.0, emb: 1.0 }
    };
    const s = sizeMap[prod.code.split('-')[2]] || sizeMap['CAS'];
    return [
      { code: s.mol, qty: 1, unit: 'UN', step: 'Armação Molejo Pocket' },
      { code: 'INS-FEL-RES', qty: s.feltro, unit: 'M2', step: 'Isolamento Molas' },
      { code: 'INS-ESP-D28', qty: s.d28_pil, unit: 'M3', step: 'Pillow Pastel 2x5cm' },
      { code: 'INS-ESP-D28', qty: s.d28_bas, unit: 'M3', step: 'Base Pillow 2x3cm' },
      { code: 'INS-ESP-D28', qty: s.d28_bor, unit: 'M3', step: 'Borda Perimetral' },
      { code: 'INS-COL-CON', qty: 0.35, unit: 'KG', step: 'Colagem Geral' },
      { code: 'INS-TEC-VEL', qty: s.vel, unit: 'M', step: 'Faixa Lateral 54cm' },
      { code: 'INS-TEC-MAT', qty: s.mat, unit: 'M', step: 'Tampo Matelassê' },
      { code: 'INS-FIT-035', qty: s.fit, unit: 'M', step: 'Fechamento Debrum' },
      { code: 'INS-EMB-PLA', qty: s.emb, unit: 'KG', step: 'Embalagem Final' }
    ];
  }

  // 5. Colchão Magnus Terapêutico (Casal, Queen, King)
  if (prod.code.startsWith('COL-MAG-')) {
    const sizeMap = {
      'CAS': { rab: 'INS-RAB-002', eps: 0.36, mdf: 5.15, d28_tam: 0.25, d28_fun: 0.05, d28_fai: 0.045, vel: 1.9, mat: 2.9, fit: 19.8, emb: 0.7 },
      'QUE': { rab: 'INS-RAB-003', eps: 0.42, mdf: 5.9, d28_tam: 0.29, d28_fun: 0.06, d28_fai: 0.05, vel: 2.1, mat: 3.3, fit: 21.6, emb: 0.8 },
      'KIN': { rab: 'INS-RAB-004', eps: 0.52, mdf: 7.2, d28_tam: 0.36, d28_fun: 0.07, d28_fai: 0.06, vel: 2.4, mat: 4.0, fit: 24.0, emb: 1.0 }
    };
    const s = sizeMap[prod.code.split('-')[2]] || sizeMap['CAS'];
    return [
      { code: 'INS-EPS-307', qty: s.eps, unit: 'M3', step: 'Núcleo Isopor EPS' },
      { code: 'INS-MDF-003', qty: s.mdf, unit: 'M2', step: 'Chapa Sustentação' },
      { code: 'INS-ESP-D28', qty: s.d28_tam, unit: 'M3', step: 'Espuma Tampo 2x5cm' },
      { code: 'INS-ESP-D28', qty: s.d28_fun, unit: 'M3', step: 'Espuma Fundo 2cm' },
      { code: 'INS-ESP-D28', qty: s.d28_fai, unit: 'M3', step: 'Espuma Faixa 32cm' },
      { code: s.rab, qty: 1, unit: 'UN', step: 'Rabatan Massagem' },
      { code: 'INS-KIT-VIB', qty: 1, unit: 'UN', step: 'Kit Vibromassagem' },
      { code: 'INS-POR-VIB', qty: 1, unit: 'UN', step: 'Bolso Porta Controle' },
      { code: 'INS-FIT-035', qty: s.fit, unit: 'M', step: 'Fechamento Debrum' },
      { code: 'INS-COL-CON', qty: 0.35, unit: 'KG', step: 'Colagem Geral' },
      { code: 'INS-TEC-MAT', qty: s.mat, unit: 'M', step: 'Tampo Matelassê' },
      { code: 'INS-TEC-VEL', qty: s.vel, unit: 'M', step: 'Faixa Veludo 40cm' },
      { code: 'INS-EMB-PLA', qty: s.emb, unit: 'KG', step: 'Embalagem Final' }
    ];
  }

  // 6. Box Life MDF (Casal, Queen Bipartido, King Bipartido)
  if (prod.code.startsWith('BOX-LIF-')) {
    const isBipartido = prod.code === 'BOX-LIF-QUE' || prod.code === 'BOX-LIF-KIN';
    const numPes = isBipartido ? 12 : 6;
    const numCant = isBipartido ? 8 : 4;
    const sizeMap = {
      'CAS': { mdf04: 2.59, mdf15: 1.65, mad: 0.018, vel: 1.6, tnt: 1.95, emb: 0.4 },
      'QUE': { mdf04: 3.12, mdf15: 2.2, mad: 0.026, vel: 2.2, tnt: 3.3, emb: 0.5 },
      'KIN': { mdf04: 3.91, mdf15: 2.5, mad: 0.030, vel: 2.5, tnt: 4.0, emb: 0.6 }
    };
    const s = sizeMap[prod.code.split('-')[2]] || sizeMap['CAS'];
    const items = [
      { code: 'INS-BUC-516', qty: numPes, unit: 'UN', step: 'Estrutura Pés' },
      { code: 'INS-CAN-PLA', qty: numCant, unit: 'UN', step: 'Cantos Acabamento' },
      { code: 'INS-MDF-004', qty: s.mdf04, unit: 'M2', step: 'Chapa Tampo' },
      { code: 'INS-MDF-015', qty: s.mdf15, unit: 'M2', step: 'Chapa Lateral' },
      { code: 'INS-EMB-PLA', qty: s.emb, unit: 'KG', step: 'Embalagem Final' },
      { code: 'INS-GRA-1438', qty: isBipartido ? 450 : 300, unit: 'UN', step: 'Armação Madeira' },
      { code: 'INS-GRA-8008', qty: isBipartido ? 450 : 300, unit: 'UN', step: 'Tapeçaria Veludo' },
      { code: 'INS-GRA-9230', qty: isBipartido ? 450 : 300, unit: 'UN', step: 'Fixação MDF' },
      { code: 'INS-MAD-001', qty: s.mad, unit: 'M3', step: 'Estrutura Madeira' },
      { code: 'INS-PE-PLA-12', qty: numPes, unit: 'UN', step: 'Montagem Pés' },
      { code: 'INS-TEC-VEL', qty: s.vel, unit: 'M', step: 'Tapeçaria Faixa' },
      { code: 'INS-TNT-040', qty: s.tnt, unit: 'M', step: 'Forro Inferior' },
      { code: 'INS-TNT-080', qty: s.tnt, unit: 'M', step: 'Tampo Superior' }
    ];
    if (isBipartido) {
      items.push({ code: 'INS-CON-BOX', qty: 2, unit: 'UN', step: 'União Bipartido' });
    }
    return items;
  }

  // 7. Box Baú Sienna (Casal, Queen Bipartido, King Bipartido)
  if (prod.code.startsWith('BAU-SIE-')) {
    const isBipartido = prod.code === 'BAU-SIE-QUE' || prod.code === 'BAU-SIE-KIN';
    const numPes = isBipartido ? 12 : 6;
    const numCant = isBipartido ? 8 : 4;
    const numPistoes = isBipartido ? 4 : 2;
    const numArt = isBipartido ? 2 : 1;
    const numPux = isBipartido ? 2 : 1;
    const numArc = isBipartido ? 2 : 1;

    const sizeMap = {
      'CAS': { mdf04: 5.18, mdf06: 2.1, r26: 0.022, mad: 0.065, vel: 4.2, tnt: 9.5, emb: 0.35, paraf: 16 },
      'QUE': { mdf04: 6.25, mdf06: 3.5, r26: 0.034, mad: 0.095, vel: 6.8, tnt: 14.5, emb: 0.55, paraf: 32 },
      'KIN': { mdf04: 7.83, mdf06: 3.9, r26: 0.038, mad: 0.108, vel: 7.4, tnt: 16.0, emb: 0.65, paraf: 32 }
    };
    const s = sizeMap[prod.code.split('-')[2]] || sizeMap['CAS'];

    const items = [
      { code: 'INS-BUC-516', qty: numPes, unit: 'UN', step: 'Estrutura Pés' },
      { code: 'INS-CAN-PLA', qty: numCant, unit: 'UN', step: 'Cantos Acabamento' },
      { code: 'INS-MDF-004', qty: s.mdf04, unit: 'M2', step: 'Chapa Tampo/Fundo' },
      { code: 'INS-MDF-006', qty: s.mdf06, unit: 'M2', step: 'Chapa Lateral' },
      { code: 'INS-EMB-PLA', qty: s.emb, unit: 'KG', step: 'Embalagem Final' },
      { code: 'INS-ESP-R26-1CM', qty: s.r26, unit: 'M3', step: 'Acolchoamento' },
      { code: 'INS-GRA-1438', qty: isBipartido ? 800 : 500, unit: 'UN', step: 'Armação Madeira' },
      { code: 'INS-GRA-8008', qty: isBipartido ? 1200 : 750, unit: 'UN', step: 'Tapeçaria Veludo' },
      { code: 'INS-GRA-9230', qty: isBipartido ? 550 : 320, unit: 'UN', step: 'Fixação MDF' },
      { code: 'INS-ART-BAU', qty: numArt, unit: 'PAR', step: 'Mecanismo Articulação' },
      { code: 'INS-PAR-6025', qty: s.paraf, unit: 'UN', step: 'Fixação Articulação' },
      { code: 'INS-MAD-002', qty: s.mad, unit: 'M3', step: 'Estrutura Madeira' },
      { code: 'INS-PE-PLA-06', qty: numPes, unit: 'UN', step: 'Montagem Pés' },
      { code: 'INS-PUX-BAU', qty: numPux, unit: 'UN', step: 'Puxador' },
      { code: 'INS-ARC-CRO', qty: numArc, unit: 'UN', step: 'Arco Retentor' },
      { code: 'INS-TEC-VEL', qty: s.vel, unit: 'M', step: 'Tapeçaria Faixa' },
      { code: 'INS-PIS-650', qty: numPistoes, unit: 'UN', step: 'Pistões Pressurizados' },
      { code: 'INS-TNT-080', qty: s.tnt, unit: 'M', step: 'Forração Interna/Tampo' }
    ];
    if (isBipartido) {
      items.push({ code: 'INS-CHA-UNI', qty: 2, unit: 'UN', step: 'Placa de Fixação Tampo' });
    }
    return items;
  }

  // 8. Box Spá Levitá (Solteiro, Casal, Queen, King)
  if (prod.code.startsWith('BOX-LEV-')) {
    const isBipartido = prod.code === 'BOX-LEV-QUE' || prod.code === 'BOX-LEV-KIN';
    const numPes = isBipartido ? 12 : 6;
    const numCant = isBipartido ? 8 : 4;
    const sizeMap = {
      'SOL': { mad: 0.022, mdf: 1.65, vel: 1.5, tnt: 1.95, emb: 0.35 },
      'CAS': { mad: 0.026, mdf: 2.59, vel: 1.8, tnt: 2.9, emb: 0.45 },
      'QUE': { mad: 0.032, mdf: 3.12, vel: 2.2, tnt: 3.3, emb: 0.55 },
      'KIN': { mad: 0.042, mdf: 3.91, vel: 2.6, tnt: 4.0, emb: 0.65 }
    };
    const s = sizeMap[prod.code.split('-')[2]] || sizeMap['SOL'];
    const items = [
      { code: 'INS-MAD-001', qty: s.mad, unit: 'M3', step: 'Estrutura Madeira Reforçada' },
      { code: 'INS-MDF-004', qty: s.mdf, unit: 'M2', step: 'Chapa Superior' },
      { code: 'INS-BUC-516', qty: numPes, unit: 'UN', step: 'Fixação Pés' },
      { code: 'INS-PE-PLA-12', qty: numPes, unit: 'UN', step: 'Pezinhos' },
      { code: 'INS-CAN-PLA', qty: numCant, unit: 'UN', step: 'Cantoneiras' },
      { code: 'INS-TEC-VEL', qty: s.vel, unit: 'M', step: 'Revestimento Veludo' },
      { code: 'INS-TNT-080', qty: s.tnt, unit: 'M', step: 'Tampo Antiderrapante' },
      { code: 'INS-GRA-1438', qty: 250, unit: 'UN', step: 'Grampo Estrutural' },
      { code: 'INS-GRA-8008', qty: 300, unit: 'UN', step: 'Grampo Tapeceiro' },
      { code: 'INS-EMB-PLA', qty: s.emb, unit: 'KG', step: 'Embalagem Protetora' }
    ];
    if (isBipartido) {
      items.push({ code: 'INS-CON-BOX', qty: 2, unit: 'UN', step: 'União Bipartido' });
    }
    return items;
  }

  // Fallback genérico caso não se encaixe
  return [
    { code: 'INS-TEC-MAT', qty: 1.5, unit: 'M', step: 'Tampo' },
    { code: 'INS-TEC-VEL', qty: 1.5, unit: 'M', step: 'Lateral' }
  ];
}

// ==========================================
// FUNÇÃO PRINCIPAL DE EXECUÇÃO
// ==========================================
async function main() {
  console.log('====================================================');
  console.log('>>> INICIANDO RESET COMPLETO E RECARGA DO CATÁLOGO <<<');
  console.log('====================================================\n');

  // ETAPA 1: Limpeza segura de dependências antigas
  console.log('1. Limpando dados legados...');
  
  // Excluir requisitos de materiais antigos
  const deletedReqs = await prisma.saleItemMaterialRequirement.deleteMany({});
  console.log(`- SaleItemMaterialRequirement excluídos: ${deletedReqs.count}`);

  // Excluir movimentações de estoque antigas para iniciar histórico limpo
  const deletedStockMovs = await prisma.stockMovement.deleteMany({});
  console.log(`- StockMovement excluídos: ${deletedStockMovs.count}`);

  // Desvincular fornecedores vinculados a insumos se houver
  await prisma.supplierSupplyItem.deleteMany({});

  // Excluir itens de receita de produto (BOM)
  const deletedRecipeRules = await prisma.productRecipeItemRule.deleteMany({});
  const deletedRecipeItems = await prisma.productRecipeItem.deleteMany({});
  const deletedRecipes = await prisma.productRecipe.deleteMany({});
  console.log(`- ProductRecipe/Items excluídos: ${deletedRecipes.count} fichas, ${deletedRecipeItems.count} itens`);

  // Desvincular detalhes de reforma de vendas de insumos antigos
  await prisma.saleItemDetailMattressReform.updateMany({
    data: {
      topFabricSupplyItemId: null,
      bottomFabricSupplyItemId: null,
      sideFabricSupplyItemId: null,
      foamSupplyItemId: null,
      tapeSupplyItemId: null,
      feetSupplyItemId: null
    }
  });
  await prisma.saleItemDetailBoxReform.updateMany({
    data: {
      topFabricSupplyItemId: null,
      sideFabricSupplyItemId: null,
      tapeSupplyItemId: null,
      feetSupplyItemId: null
    }
  });
  await prisma.saleItemDetailNewMattress.updateMany({
    data: {
      topFabricSupplyItemId: null,
      bottomFabricSupplyItemId: null,
      sideFabricSupplyItemId: null,
      foamSupplyItemId: null,
      tapeSupplyItemId: null,
      feetSupplyItemId: null
    }
  });
  await prisma.saleItemDetailNewBox.updateMany({
    data: {
      topFabricSupplyItemId: null,
      sideFabricSupplyItemId: null,
      tapeSupplyItemId: null,
      feetSupplyItemId: null
    }
  });

  // Excluir todos os insumos existentes
  const deletedSupplies = await prisma.supplyItem.deleteMany({});
  console.log(`- SupplyItem excluídos: ${deletedSupplies.count}`);

  // Desvincular produtos de itens de venda históricos para manter integridade contábil das vendas passadas
  await prisma.saleItem.updateMany({
    data: { productServiceId: null }
  });

  // Excluir todos os produtos existentes
  const deletedProducts = await prisma.productService.deleteMany({});
  console.log(`- ProductService excluídos: ${deletedProducts.count}`);

  console.log('\n2. Criando/Atualizando Categorias de Insumo...');
  const categoryNames = Array.from(new Set(INSUMOS.map(i => i.category)));
  const categoryMap = new Map();

  for (const catName of categoryNames) {
    const cat = await prisma.supplyCategory.upsert({
      where: { name: catName },
      update: { isActive: true },
      create: { name: catName, isActive: true }
    });
    categoryMap.set(catName, cat.id);
  }
  console.log(`- ${categoryMap.size} categorias de insumo prontas.`);

  console.log('\n3. Cadastrando 50 Novos Insumos...');
  const supplyMap = new Map(); // code -> SupplyItem

  for (const ins of INSUMOS) {
    const item = await prisma.supplyItem.create({
      data: {
        code: ins.code,
        name: ins.name,
        categoryId: categoryMap.get(ins.category),
        unit: ins.unit,
        averageCost: ins.cost,
        lastPurchaseCost: ins.cost,
        description: `${ins.spec} | Origem: ${ins.source}`,
        currentStock: 100, // Estoque inicial base para operações
        minimumStock: 10,
        isActive: true
      }
    });
    supplyMap.set(ins.code, item);
  }
  console.log(`- ${supplyMap.size} insumos cadastrados com sucesso.`);

  console.log('\n4. Cadastrando 40 Novos Produtos & Serviços...');
  const productMap = new Map(); // code -> ProductService

  for (const prod of PRODUTOS) {
    // Definir preço de venda sugerido comercial (markup base 2.2x sobre custo ou mín 1.8x)
    const suggestedPrice = Math.round((prod.cost * 2.2) * 10) / 10;
    
    const product = await prisma.productService.create({
      data: {
        code: prod.code,
        name: prod.name,
        type: prod.type === 'SERVICO' ? 'SERVICE' : 'PRODUCT',
        operationalCategory: prod.line,
        unit: 'UN',
        defaultCost: prod.cost,
        defaultPrice: suggestedPrice,
        minimumPrice: prod.cost,
        // Configuração de estoque e ficha técnica:
        useTechnicalSheet: true,
        consumesStock: true,
        generatesProductionOrder: true,
        managesStock: false, // O estoque gerenciado é o dos insumos da ficha técnica
        internalNotes: `Tamanho: ${prod.size} (${prod.l}m x ${prod.w}m x ${prod.h}m) | Origem: ${prod.source}`,
        isActive: true
      }
    });
    productMap.set(prod.code, product);
  }
  console.log(`- ${productMap.size} produtos/serviços cadastrados com sucesso.`);

  console.log('\n5. Criando Fichas Técnicas (BOM) e Itens de Consumo...');
  let totalRecipeItemsCount = 0;

  for (const prod of PRODUTOS) {
    const dbProduct = productMap.get(prod.code);
    const bomItems = getBOMForProduct(prod);

    // Criar a receita padrão
    const recipe = await prisma.productRecipe.create({
      data: {
        productServiceId: dbProduct.id,
        name: `Ficha Técnica - ${prod.name}`,
        variant: prod.size,
        operationalCategory: prod.line,
        description: `BOM padrão de engenharia para ${prod.name}`,
        isDefault: true,
        isActive: true,
        consumesStock: true,
        generatesProductionOrder: true,
        lossPercentage: 0,
        estimatedProductionMinutes: prod.type === 'SERVICO' ? 120 : 180,
        items: {
          create: bomItems.map((bi, idx) => {
            const supply = supplyMap.get(bi.code);
            if (!supply) {
              throw new Error(`Insumo não encontrado no mapa: ${bi.code}`);
            }
            return {
              supplyItemId: supply.id,
              componentPart: bi.step,
              baseQuantity: bi.qty,
              unit: bi.unit || supply.unit,
              multiplier: 1,
              wastePercentage: 0,
              displayOrder: idx + 1,
              notes: bi.step
            };
          })
        }
      }
    });

    totalRecipeItemsCount += bomItems.length;
  }

  console.log(`- 40 Fichas Técnicas criadas com ${totalRecipeItemsCount} itens de insumo vinculados!`);

  console.log('\n====================================================');
  console.log('>>> CARGA COMPLETA REALIZADA COM SUCESSO! <<<');
  console.log('====================================================');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('ERRO NA EXECUÇÃO:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
