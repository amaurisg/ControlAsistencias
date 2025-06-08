function convertirHoraA24(hora12) {
    if (!hora12) return null;
    const [time, modifier] = hora12.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier.toLowerCase() === 'pm') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function convertirHoraA12(hora24) {
    if (!hora24) return '-';
    let [hours, minutes] = hora24.split(':');
    const hoursInt = parseInt(hours, 10);
    const modifier = hoursInt >= 12 ? 'PM' : 'AM';

    hours = hoursInt % 12 || 12;

    return `${hours}:${minutes} ${modifier}`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { convertirHoraA24, convertirHoraA12 };
} else {
    window.convertirHoraA24 = convertirHoraA24;
    window.convertirHoraA12 = convertirHoraA12;
}
