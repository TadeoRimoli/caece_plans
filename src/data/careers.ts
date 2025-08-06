import type { Career } from "../types";

export const careersData: Career[] = [
  {
  id: 1,
  name: "Licenciatura en Sistemas",
  plan: "10Z",
  year: 2016,
  icon :"💻",

  subjects: [
    {
      code: 7301,
      name: "Introducción a la Matemática",
      year: 1,
      quadrimester: 1,
      prerequisites: [],
      status: 0
    },
    {
      code: 8015,
      name: "Introducción a la Informática",
      year: 1,
      quadrimester: 1,
      prerequisites: [],
      status: 0
    },
    {
      code: 7015,
      name: "Lógica",
      year: 1,
      quadrimester: 1,
      prerequisites: [],
      status: 0
    },
     {
      code: 1618,
      name: "Cálculo en una Variable",
      year: 1,
      quadrimester: 2,
      prerequisites: [7301],
      status: 0
    },
    {
      code: 7256,
      name: "Arquitectura de Computadoras",
      year: 1,
      quadrimester: 2,
      prerequisites: [],
      status: 0
    },
    {
      code: 7307,
      name: "Algoritmos y Estructuras de Datos I",
      year: 1,
      quadrimester: 2,
      prerequisites: [8015],
      status: 0
    },

    {
      code: 2076,
      name: "Aspectos Profesionales de Sistemas",
      year: 2,
      quadrimester: 1,
      prerequisites: [],
      status: 0
    },
    {
      code: 7014,
      name: "Álgebra",
      year: 2,
      quadrimester: 1,
      prerequisites: [7301],
      status: 0
    },
    {
      code: 7309,
      name: "Algoritmos y Estructuras de Datos II",
      year: 2,
      quadrimester: 1,
      prerequisites: [7307],
      status: 0
    },
    {
      code: 1620,
      name: "Sistemas Operativos I",
      year: 2,
      quadrimester: 2,
      prerequisites: [7014,7256,7307],
      status: 0
    },

    {
      code: 1623,
      name: "Cálculo en Varias Variables",
      year: 2,
      quadrimester: 2,
      prerequisites: [1618,7014],
      status: 0
    },
   {
      code: 5521,
      name: "Epistemología",
      year: 2,
      quadrimester: 2,
      prerequisites: [7015],
      status: 0
    },
    {
      code: 7025,
      name: "Matemática Discreta",
      year: 2,
      quadrimester: 2,
      prerequisites: [7301],
      status: 0
    },
    {
      code: 1001,
      name: "Ingles Técnico",
      year: 2,
      quadrimester: 2,
      prerequisites: [],
      status: 0
    },
        {
      code: 1189,
      name: "Ingeniería de Software I",
      year: 3,
      quadrimester: 1,
      prerequisites: [1001,7307],
      status: 0
    },
    {
      code: 2077,
      name: "Bases de Datos I",
      year: 3,
      quadrimester: 1,
      prerequisites: [1620],
      status: 0
    },
    {
      code: 7319,
      name: "Probabilidad y Estadística",
      year: 3,
      quadrimester: 1,
      prerequisites: [1623],
      status: 0
    },

        {
      code: 1190,
      name: "Ingeniería de Software II",
      year: 3,
      quadrimester: 2,
      prerequisites: [1189,2077],
      status: 0
    },
       {
      code: 2079,
      name: "Sistemas de Información y Organización",
      year: 3,
      quadrimester: 2,
      prerequisites: [7307],
      status: 0
    },
    {
      code: 7315,
      name: "Fundamentos de Comunicación",
      year: 3,
      quadrimester: 2,
      prerequisites: [1623],
      status: 0
    },
    {
      code: 1291,
      name: "Modelos y Simulación",
      year: 4,
      quadrimester: 1,
      prerequisites: [7307,7319],
      status: 0
    },
     {
      code: 1350,
      name: "Sistemas Inteligentes",
      year: 4,
      quadrimester: 1,
      prerequisites: [7025,7309],
      status: 0
    },
     {
      code: 2080,
      name: "Paradigmas de Programación",
      year: 4,
      quadrimester: 1,
      prerequisites: [7015,7309],
      status: 0
    },
    {
      code: 7283,
      name: "Teleprocesos y Redes I",
      year: 4,
      quadrimester: 1,
      prerequisites: [1620,7315],
      status: 0
    },
    
    {
      code: 7329,
      name: "Lenguajes Formales",
      year: 4,
      quadrimester: 1,
      prerequisites: [7025,7307],
      status: 0
    },
    {
      code: 1638,
      name: "Arquitectura Web",
      year: 4,
      quadrimester: 2,
      prerequisites: [1190,7283],
      status: 0
    },
    {
      code: 2078,
      name: "Bases de Datos II",
      year: 4,
      quadrimester: 2,
      prerequisites: [2077],
      status: 0
    },
    {
      code: 2081,
      name: "Gestión de Proyectos y Calidad",
      year: 4,
      quadrimester: 2,
      prerequisites: [1190],
      status: 0
    },
    {
      code: 7292,
      name: "Teleprocesos y Redes II",
      year: 4,
      quadrimester: 2,
      prerequisites: [7283],
      status: 0
    },
{
      code: 1629,
      name: "Sistemas Operativos II",
      year: 5,
      quadrimester: 1,
      prerequisites: [1620,7292],
      status: 0
    },
      {
      code: 2082,
      name: "Programación Avanzada",
      year: 5,
      quadrimester: 1,
      prerequisites: [1620,2080],
      status: 0
    },
 {
      code: 2083,
      name: "Dirección Estratégica",
      year: 5,
      quadrimester: 1,
      prerequisites: [2079],
      status: 0
    },

    {
      code: 2084,
      name: "Trabajo Final I",
      year: 5,
      quadrimester: 1,
      prerequisites: [5521],
      extraConditions: "20 asignaturas aprobadas",
      status: 0
    },
    {
      code: 2085,
      name: "Inteligencia de Negocios",
      year: 5,
      quadrimester: 2,
      prerequisites: [1350,2078],
      status: 0
    },
     {
      code: 2086,
      name: "Complejidad Algorítmica",
      year: 5,
      quadrimester: 2,
      prerequisites: [2082,7025],
      status: 0
    },
    {
      code: 2087,
      name: "Trabajo Final II",
      year: 5,
      quadrimester: 2,
      prerequisites: [2084],
      status: 0
    },
    {
      code: 2088,
      name: "Auditoría y Seguridad Informática",
      year: 5,
      quadrimester: 2,
      prerequisites: [2081,7283],
      status: 0
    },
   
  
    {
      code: 2091,
      name: "Práctica Profesional Supervisada",
      year: 5,
      quadrimester: 2,
      prerequisites: [],
      extraConditions: "25 asignaturas aprobadas",
      status: 0
    }
  ]
}
  ,{
  id: 2,
  name: "Licenciatura en Sistemas",
  plan: "10Z",
  year: 2010,
  icon :"💻",

  subjects: [
    {
      code: 7301,
      name: "Introducción a la Matemática",
      year: 1,
      quadrimester: 1,
      prerequisites: [],
      status: 0
    },
    {
      code: 8015,
      name: "Introducción a la Informática",
      year: 1,
      quadrimester: 1,
      prerequisites: [],
      status: 0
    },
    {
      code: 7015,
      name: "Lógica",
      year: 1,
      quadrimester: 1,
      prerequisites: [],
      status: 0
    },
     {
      code: 1618,
      name: "Cálculo en una Variable",
      year: 1,
      quadrimester: 2,
      prerequisites: [7301],
      status: 0
    },
    {
      code: 7256,
      name: "Arquitectura de Computadoras",
      year: 1,
      quadrimester: 2,
      prerequisites: [],
      status: 0
    },
    {
      code: 7307,
      name: "Algoritmos y Estructuras de Datos I",
      year: 1,
      quadrimester: 2,
      prerequisites: [8015],
      status: 0
    },

    {
      code: 2076,
      name: "Aspectos Profesionales de Sistemas",
      year: 2,
      quadrimester: 1,
      prerequisites: [],
      status: 0
    },
    {
      code: 7014,
      name: "Álgebra",
      year: 2,
      quadrimester: 1,
      prerequisites: [7301],
      status: 0
    },
    {
      code: 7309,
      name: "Algoritmos y Estructuras de Datos II",
      year: 2,
      quadrimester: 1,
      prerequisites: [7307],
      status: 0
    },
    {
      code: 1620,
      name: "Sistemas Operativos I",
      year: 2,
      quadrimester: 2,
      prerequisites: [7014,7256,7307],
      status: 0
    },

    {
      code: 1623,
      name: "Cálculo en Varias Variables",
      year: 2,
      quadrimester: 2,
      prerequisites: [1618,7014],
      status: 0
    },
   {
      code: 5521,
      name: "Epistemología",
      year: 2,
      quadrimester: 2,
      prerequisites: [7015],
      status: 0
    },
    {
      code: 7025,
      name: "Matemática Discreta",
      year: 2,
      quadrimester: 2,
      prerequisites: [7301],
      status: 0
    },
    {
      code: 1001,
      name: "Ingles Técnico",
      year: 2,
      quadrimester: 2,
      prerequisites: [],
      status: 0
    },
        {
      code: 1189,
      name: "Ingeniería de Software I",
      year: 3,
      quadrimester: 1,
      prerequisites: [1001,7307],
      status: 0
    },
    {
      code: 2077,
      name: "Bases de Datos I",
      year: 3,
      quadrimester: 1,
      prerequisites: [1620],
      status: 0
    },
    {
      code: 7319,
      name: "Probabilidad y Estadística",
      year: 3,
      quadrimester: 1,
      prerequisites: [1623],
      status: 0
    },

        {
      code: 1190,
      name: "Ingeniería de Software II",
      year: 3,
      quadrimester: 2,
      prerequisites: [1189,2077],
      status: 0
    },
       {
      code: 2079,
      name: "Sistemas de Información y Organización",
      year: 3,
      quadrimester: 2,
      prerequisites: [],
      status: 0
    },
    {
      code: 7315,
      name: "Fundamentos de Comunicación",
      year: 3,
      quadrimester: 2,
      prerequisites: [1623],
      status: 0
    },
    {
      code: 1291,
      name: "Modelos y Simulación",
      year: 4,
      quadrimester: 1,
      prerequisites: [7307,7319],
      status: 0
    },
     {
      code: 1350,
      name: "Sistemas Inteligentes",
      year: 4,
      quadrimester: 1,
      prerequisites: [7025,7309],
      status: 0
    },
     {
      code: 2080,
      name: "Paradigmas de Programación",
      year: 4,
      quadrimester: 1,
      prerequisites: [7015,7309],
      status: 0
    },
    {
      code: 7283,
      name: "Teleprocesos y Redes I",
      year: 4,
      quadrimester: 1,
      prerequisites: [1620,7315],
      status: 0
    },
    
    {
      code: 7329,
      name: "Lenguajes Formales",
      year: 4,
      quadrimester: 1,
      prerequisites: [7025,7307],
      status: 0
    },
    {
      code: 1638,
      name: "Arquitectura Web",
      year: 4,
      quadrimester: 2,
      prerequisites: [1190,7283],
      status: 0
    },
    {
      code: 2078,
      name: "Bases de Datos II",
      year: 4,
      quadrimester: 2,
      prerequisites: [2077],
      status: 0
    },
    {
      code: 2081,
      name: "Gestión de Proyectos y Calidad",
      year: 4,
      quadrimester: 2,
      prerequisites: [1190],
      status: 0
    },
    {
      code: 7292,
      name: "Teleprocesos y Redes II",
      year: 4,
      quadrimester: 2,
      prerequisites: [7283],
      status: 0
    },
{
      code: 1629,
      name: "Sistemas Operativos II",
      year: 5,
      quadrimester: 1,
      prerequisites: [1620,7292],
      status: 0
    },
      {
      code: 2082,
      name: "Programación Avanzada",
      year: 5,
      quadrimester: 1,
      prerequisites: [1620,2080],
      status: 0
    },
 {
      code: 2083,
      name: "Dirección Estratégica",
      year: 5,
      quadrimester: 1,
      prerequisites: [2079],
      status: 0
    },

    {
      code: 2084,
      name: "Trabajo Final I",
      year: 5,
      quadrimester: 1,
      prerequisites: [1001,1189,1190,1291,1350,1618,1620,1623,1638,2076,2077,2078,2079,2080,2081,2089,2090,5521,7014,7015,7025,7256,7283,7292,7301,7307,7309,7315,7319,7329,8015],
      status: 0
    },
    {
      code: 2085,
      name: "Inteligencia de Negocios",
      year: 5,
      quadrimester: 2,
      prerequisites: [1350,2078],
      status: 0
    },
     {
      code: 2086,
      name: "Complejidad Algorítmica",
      year: 5,
      quadrimester: 2,
      prerequisites: [2082,7025],
      status: 0
    },
    {
      code: 2087,
      name: "Trabajo Final II",
      year: 5,
      quadrimester: 2,
      prerequisites: [2084],
      status: 0
    },
    {
      code: 2088,
      name: "Auditoría y Seguridad Informática",
      year: 5,
      quadrimester: 2,
      prerequisites: [2081,7283],
      status: 0
    },
   
  
    {
      code: 2091,
      name: "Práctica Profesional Supervisada",
      year: 5,
      quadrimester: 2,
      prerequisites: [1001,1189,1190,1291,1350,1618,1620,1623,1629,1638,2076,2077,2078,2079,2080,2081,2082,2083,2084,2089,2090,5521,7014,7015,7025,7256,7283,7292,7301,7307,7309,7315,7319,7329,8015],
      status: 0
    }
  ]
}
];
