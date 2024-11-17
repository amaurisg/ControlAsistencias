// Funci�n para cargar los nombres del personal en el formulario
function cargarNombresPersonal() {
    const nombres = [
        'Elsa Margarita Calderon Mu�oz',
        'Dinorah Alt.De La Cruz Encarnacion',
        'Kelvin Antonio Lopez Pichardo',
        'Maria Teresa Caraballo Fernandez',
        'Germania Torres Martinez',
        'Angel Miguel Reyes Cordero',
        'Arisleida Del Carmen Garcia Lopez',
        'Awilda Mercedes Feliz',
        'Bibiana Hernandez Marte',
        'Cayerlin Maria Valerio Valerio',
        'Ana Carmi�a Perez Genao',
        'Danilva Awanda Jimenez',
        'Dulce Abreu Camacho',
        'Estefany Andreina Hidalgo Perez',
        'Amauris Francisco Genao De Leon',
        'Juan Carlos De Jesus Marte',
        'Juana Leonida Mu�oz Velasquez',
        'Juana Ivelisse Arnaut Portes',
        'Ketty Altagracia Pe�a Esquea',
        'Kimberli Grullon Tejeda',
        'Lidia Mercedes Cabrera Rubio',
        'Lisseth Capellan De La Cruz',
        'Luz Del Pilar De Jesus Contreras',
        'Nicolas Marmolejos Jimenez',
        'Olga Lidia Rodriguez Nu�ez',
        'Richard Guillermo Maria Duran',
        'Sobeida Maria Cruz Rosario De Dicen',
        'Yaneiry Maria Marmolejos Marmolejos',
        'Yani Mendez Mendez',
        'Alexandra Suriel Garcia',
        'Deyanira De La Cruz Gomez',
        'Jennifer Del Carmen Abreu Bautista',
        'Yubelkys De La Rosa Valerio',
        'Nestor Ramon Paulino Marte',
        'Luz Divina Rodriguez Nu�ez',
        'Denice Bautista Garcia',
        'Juan De Jesus'
        // Agrega m�s nombres seg�n sea necesario
    ];

    const selectNombre = document.getElementById('nombre');
    // Limpiar opciones anteriores
    selectNombre.innerHTML = '<option value="">Seleccione un nombre</option>';

    nombres.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.text = nombre;
        selectNombre.add(option);
    });
}
