const terminalInput = document.getElementById('terminal-input');
const terminalBody = document.getElementById('terminal-body');

const commands = {
    help: 'Команды: whoami, media, choir, contact, clear',
    whoami: 'Студент ИМКТ ДВФУ. Пишу на JS и Python, разбираюсь в сетях и вебе.',
    media: 'Глава отдела в студенческой организации «Сейчас Объясню». Отвечаю за команду и выпуск материалов.',
    choir: 'Артист Академического хора ДВФУ. Участвую в концертах и международных конкурсах.',
    contact: 'Telegram: @your_telegram | GitHub: ://github.com'
};

function printLine(text, className = '') {
    const div = document.createElement('div');
    div.className = `line ${className}`.trim();
    div.textContent = text;
    terminalBody.insertBefore(div, terminalInput.parentElement);
}

terminalInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    const raw = terminalInput.value.trim();
    const cmd = raw.toLowerCase();
    terminalInput.value = '';

    if (!cmd) return;

    printLine(`$ ${raw}`, 'muted');

    if (cmd === 'clear') {
        const lines = terminalBody.querySelectorAll('.line');
        lines.forEach(line => line.remove());
        return;
    }

    if (commands[cmd]) {
        printLine(commands[cmd], 'accent');
    } else {
        printLine(`Неизвестная команда: ${cmd}. Введите help.`);
    }

    terminalBody.scrollTop = terminalBody.scrollHeight;
});

terminalBody.addEventListener('click', () => {
    terminalInput.focus();
});
