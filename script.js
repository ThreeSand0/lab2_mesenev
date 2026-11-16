const terminalInput = document.getElementById('terminal-input');
const terminalBody = document.getElementById('terminal-body');

// База ответов для обновленного терминала
const commands = {
    help: "Доступные команды: <br>• <b>about</b> - подробнее обо мне<br>• <b>media</b> - про организацию 'Сейчас Объясню'<br>• <b>choir</b> - про Академический хор<br>• <b>clear</b> - очистить консоль",
    about: "Я студент ИМКТ ДВФУ. Совмещаю изучение компьютерных технологий с активной лидерской и творческой деятельностью в университете.",
    media: "Я являюсь главой отдела в студенческой организации 'Сейчас Объясню'. Это крупное медиа-сообщество ДВФУ, где мы создаем качественный контент, пишем статьи и управляем инфопотоками.",
    choir: "Пою в Международном академическом хоре ДВФУ. Наш коллектив регулярно берет награды на престижных российских и зарубежных хоровых конкурсах."
};

terminalInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const input = terminalInput.value.trim().toLowerCase();
        terminalInput.value = '';

        if (!input) return;

        const echoLine = document.createElement('div');
        echoLine.className = 'output system';
        echoLine.innerHTML = `<span style="color:#22c55e">guest@imct-student:~$</span> ${input}`;
        terminalBody.insertBefore(echoLine, terminalInput.parentElement);

        if (input === 'clear') {
            const outputs = terminalBody.querySelectorAll('.output');
            outputs.forEach(out => out.remove());
        } else if (commands[input]) {
            const responseLine = document.createElement('div');
            responseLine.className = 'output';
            responseLine.innerHTML = commands[input];
            terminalBody.insertBefore(responseLine, terminalInput.parentElement);
        } else {
            const errorLine = document.createElement('div');
            errorLine.className = 'output error';
            errorLine.innerText = `Команда '${input}' не распознана. Введите 'help'.`;
            terminalBody.insertBefore(errorLine, terminalInput.parentElement);
        }

        terminalBody.scrollTop = terminalBody.scrollHeight;
    }
});

terminalBody.addEventListener('click', () => {
    terminalInput.focus();
});
