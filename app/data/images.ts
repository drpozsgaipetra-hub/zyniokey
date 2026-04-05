export type Category = 'viszony' | 'dontes' | 'ter';

export interface ZynioImage {
  id: string;
  filename: string;
  category: Category;
  label: string;
}

export const images: ZynioImage[] = [
  // VISZONY
  { id: 'v1', filename: 'img03.png', category: 'viszony', label: 'Kép 1' },
  { id: 'v2', filename: 'img06.png', category: 'viszony', label: 'Kép 2' },
  { id: 'v3', filename: 'img12.png', category: 'viszony', label: 'Kép 3' },
  { id: 'v4', filename: 'img15.png', category: 'viszony', label: 'Kép 4' },
  { id: 'v5', filename: 'img17.png', category: 'viszony', label: 'Kép 5' },
  { id: 'v6', filename: 'img20.png', category: 'viszony', label: 'Kép 6' },
  { id: 'v7', filename: 'img22.png', category: 'viszony', label: 'Kép 7' },
  { id: 'v8', filename: 'img23.png', category: 'viszony', label: 'Kép 8' },
  { id: 'v9', filename: 'img25.png', category: 'viszony', label: 'Kép 9' },
  { id: 'v10', filename: 'img33.png', category: 'viszony', label: 'Kép 10' },
  { id: 'v11', filename: 'img34.png', category: 'viszony', label: 'Kép 11' },
  { id: 'v12', filename: 'img36.png', category: 'viszony', label: 'Kép 12' },

  // DÖNTÉS
  { id: 'd1', filename: 'img01.png', category: 'dontes', label: 'Kép 13' },
  { id: 'd2', filename: 'img04.png', category: 'dontes', label: 'Kép 14' },
  { id: 'd3', filename: 'img05.png', category: 'dontes', label: 'Kép 15' },
  { id: 'd4', filename: 'img10.png', category: 'dontes', label: 'Kép 16' },
  { id: 'd5', filename: 'img14.png', category: 'dontes', label: 'Kép 17' },
  { id: 'd6', filename: 'img16.png', category: 'dontes', label: 'Kép 18' },
  { id: 'd7', filename: 'img18.png', category: 'dontes', label: 'Kép 19' },
  { id: 'd8', filename: 'img19.png', category: 'dontes', label: 'Kép 20' },
  { id: 'd9', filename: 'img24.png', category: 'dontes', label: 'Kép 21' },
  { id: 'd10', filename: 'img29.png', category: 'dontes', label: 'Kép 22' },
  { id: 'd11', filename: 'img31.png', category: 'dontes', label: 'Kép 23' },
  { id: 'd12', filename: 'img27.png', category: 'dontes', label: 'Kép 24' },

  // TÉR
  { id: 't1', filename: 'img02.png', category: 'ter', label: 'Kép 25' },
  { id: 't2', filename: 'img07.png', category: 'ter', label: 'Kép 26' },
  { id: 't3', filename: 'img08.png', category: 'ter', label: 'Kép 27' },
  { id: 't4', filename: 'img09.png', category: 'ter', label: 'Kép 28' },
  { id: 't5', filename: 'img11.png', category: 'ter', label: 'Kép 29' },
  { id: 't6', filename: 'img13.png', category: 'ter', label: 'Kép 30' },
  { id: 't7', filename: 'img21.png', category: 'ter', label: 'Kép 31' },
  { id: 't8', filename: 'img26.png', category: 'ter', label: 'Kép 32' },
  { id: 't9', filename: 'img30.png', category: 'ter', label: 'Kép 33' },
  { id: 't10', filename: 'img35.png', category: 'ter', label: 'Kép 34' },
  { id: 't11', filename: 'img32.png', category: 'ter', label: 'Kép 35' },
  { id: 't12', filename: 'img28.png', category: 'ter', label: 'Kép 36' },
];