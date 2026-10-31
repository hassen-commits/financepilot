// Entrées et attentes écrites séparément du moteur. Aucun générateur de référence.
const rows=[
 ['6',1,100,-20,-30,-10,5,5],['6',2,130,-20,-30,-10,7,6],
 ['4390',1,100,-20,-30,-10,5,5],['4390',2,100,-30,-30,-10,5,5],
 ['4389',1,100,-20,-30,-10,5,5],['4389',2,105,-20,-30,-10,5,5],
 ['4578',1,100,-20,-30,-10,5,5],['4578',2,100,-20,-35,-10,5,5],
 ['4579',1,100,-20,-30,-10,5,5],['4579',2,100,-20,-30,-10,5,5]
].map(([division,month,revenue,purchases,payroll,other,capitalizedACE,capitalizedPayroll])=>({year:2026,month,division,revenue,purchases,payroll,other,capitalizedACE,capitalizedPayroll}));
module.exports={rows,expected:{E:{previous:20000,current:22000,amount:2000,percent:10,divisions:[3000,-1000,500,-500,0],rubrics:[3500,-1000,-500,0]},H:{previous:15000,current:16700,amount:1700,divisions:[2700,-1000,500,-500,0],rubrics:[3500,-1000,-500,0,-200,-100]}}};
