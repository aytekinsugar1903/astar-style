const colors:Record<string,string>={Siyah:"#222222",Krem:"#E7DFD0",Bordo:"#6E2D3A",Lacivert:"#23314D",Toprak:"#9A7254",Pastel:"#D9C8D8",Beyaz:"#F4F2EC",Mavi:"#6282A6",Yeşil:"#627B68",Kırmızı:"#A83642",Gri:"#858585"};
export function productColor(value:string){return colors[value]??"#CFC7BB";}
