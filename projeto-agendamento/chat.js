document.addEventListener('DOMContentLoaded', () => {
    // ESTADO DA APLICAÇÃO (será preenchido pela API)
    let appData = {
        business: { name: 'Barbearia do Felipe' },
        services: { 'Corte de Cabelo': 40, 'Barba': 30, 'Cabelo + Barba': 65, 'Sobrancelha': 20, 'Platinado': 150 },
    };
    const selection = { service: null, date: null, time: null, name: '', phone: '', paymentMethod: null };

    // --- Elementos da UI ---
    const chatBody = document.getElementById('chat-body');
    const responseArea = document.getElementById('response-area');
    const businessNameTitle = document.getElementById('business-name-title');
    
    businessNameTitle.textContent = `Assistente da ${appData.business.name}`;

    // --- Funções do Chat ---
    const addMessage = (sender, message, isHtml = false) => {
        const messageDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        messageDiv.className = `chat-message flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
        contentDiv.className = `max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
            sender === 'user'
                ? 'bg-teal-600 text-white rounded-br-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
        }`;

        if (isHtml) {
            contentDiv.innerHTML = message;
        } else {
            contentDiv.textContent = message;
        }

        messageDiv.appendChild(contentDiv);
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    const showTypingIndicator = () => {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'chat-message flex justify-start';
        typingDiv.innerHTML = `<div class="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-2xl rounded-bl-none typing-indicator"><span>●</span><span>●</span><span>●</span></div>`;
        chatBody.appendChild(typingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    };
    
    const removeTypingIndicator = () => {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    };

    const clearResponseArea = () => { responseArea.innerHTML = ''; };

    // --- Lógica do Fluxo de Conversa ---
    let currentStep = 'start';

    const handleConversation = (userResponse = null) => {
        clearResponseArea();
        if(userResponse) addMessage('user', userResponse.text);

        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            runStep(userResponse);
        }, 1000);
    };

    const runStep = (userResponse) => {
        switch(currentStep) {
            case 'start':
                addMessage('bot', `Olá! 👋 Bem-vindo ao agendamento da ${appData.business.name}. Qual serviço você gostaria de fazer hoje?`);
                showServiceOptions();
                break;
            
            case 'askDate':
                selection.service = userResponse.value;
                addMessage('bot', `Ótima escolha! Agora, para qual dia você gostaria de agendar o serviço de ${selection.service}?`);
                showDatePicker();
                break;

            case 'askTime':
                selection.date = userResponse.value;
                const formattedDate = new Date(selection.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
                addMessage('bot', `Perfeito, para o dia ${formattedDate}. Qual horário fica melhor para você?`);
                showTimeSlots(selection.date);
                break;
            
            case 'askName':
                selection.time = userResponse.value;
                addMessage('bot', `Legal! Agendando para as ${selection.time}. Para finalizar, qual é o seu nome?`);
                showTextInput('name');
                break;
            
            case 'askPhone':
                selection.name = userResponse.value;
                addMessage('bot', `Oi, ${selection.name}! E qual o seu número de WhatsApp para contato?`);
                showTextInput('phone');
                break;

            case 'askPayment':
                selection.phone = userResponse.value;
                addMessage('bot', `Estamos quase lá. Como você prefere pagar?`);
                showPaymentOptions();
                break;
            
            case 'confirm':
                selection.paymentMethod = userResponse.value;
                const finalDate = new Date(selection.date + 'T00:00:00').toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'});
                const confirmationMessage = `
                    <b>Agendamento Confirmado! ✅</b><br><br>
                    <b>Serviço:</b> ${selection.service}<br>
                    <b>Valor:</b> R$ ${appData.services[selection.service].toFixed(2).replace('.', ',')}<br>
                    <b>Data:</b> ${finalDate}<br>
                    <b>Horário:</b> ${selection.time}<br>
                    <b>Pagamento:</b> ${selection.paymentMethod}
                `;
                addMessage('bot', confirmationMessage, true);
                saveAppointment(); // <-- CHAMADA PRINCIPAL
                addMessage('bot', "Seu horário foi salvo no nosso sistema. Obrigado!");
                showRestartOption();
                break;

            case 'restart':
                Object.keys(selection).forEach(k => selection[k] = null);
                currentStep = 'start';
                handleConversation();
                break;
        }
    };

    // --- Funções para Mostrar Opções ---
    const showServiceOptions = () => {
        currentStep = 'askDate';
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'grid grid-cols-2 gap-2';
        Object.entries(appData.services).forEach(([service, price]) => {
            const button = document.createElement('button');
            button.className = 'w-full p-3 text-left text-teal-800 bg-teal-100 dark:text-teal-100 dark:bg-teal-900/50 rounded-lg transition-transform duration-150 ease-in-out hover:scale-105';
            const formattedPrice = `R$ ${price.toFixed(2).replace('.', ',')}`;
            button.innerHTML = `<span class="font-bold text-sm block">${service}</span><span class="text-xs opacity-90">${formattedPrice}</span>`;
            button.onclick = () => handleConversation({ text: `${service} - ${formattedPrice}`, value: service });
            optionsContainer.appendChild(button);
        });
        responseArea.appendChild(optionsContainer);
    };
    
    const showDatePicker = () => {
        currentStep = 'askTime';
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.min = today;
        dateInput.value = today;
        dateInput.className = 'w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white';
        dateInput.onchange = () => handleConversation({ text: dateInput.value, value: dateInput.value });
        responseArea.appendChild(dateInput);
    };

    const showTimeSlots = async (date) => {
        currentStep = 'askName';
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto';
        
        let bookedTimes = [];
        try {
            // CORREÇÃO: Usando caminho relativo correto baseado na sua estrutura de pastas
            const response = await fetch(`../projeto-gestao/api.php?acao=getHorarios&data=${date}`);
            const data = await response.json();
            if (data.sucesso) {
                bookedTimes = data.dados.horarios.map(time => time.substring(0, 5));
            }
        } catch (e) { console.error("Não foi possível buscar horários.", e); }

        const workingHours = { start: 9, end: 18, interval: 30, lunchStart: 12, lunchEnd: 13 };
        
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
            if (hour >= workingHours.lunchStart && hour < workingHours.lunchEnd) {
                continue;
            }
            for (let minute = 0; minute < 60; minute += workingHours.interval) {
                const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const isBooked = bookedTimes.includes(time);
                if (!isBooked) {
                    const button = document.createElement('button');
                    button.className = 'p-2 text-sm text-teal-700 bg-teal-100 dark:text-teal-200 dark:bg-teal-900/50 rounded-lg font-semibold';
                    button.textContent = time;
                    button.onclick = () => handleConversation({ text: time, value: time });
                    optionsContainer.appendChild(button);
                }
            }
        }
        if (optionsContainer.children.length === 0) {
            optionsContainer.innerHTML = `<p class="col-span-full text-center text-sm dark:text-gray-300">Nenhum horário disponível para esta data.</p>`;
        }
        responseArea.appendChild(optionsContainer);
    };

    const showTextInput = (type) => {
        const form = document.createElement('form');
        form.className = 'flex gap-2';
        const input = document.createElement('input');
        input.className = 'w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white';
        
        if (type === 'name') {
            currentStep = 'askPhone';
            input.type = 'text';
            input.placeholder = 'Digite seu nome...';
        } else {
            currentStep = 'askPayment';
            input.type = 'tel';
            input.placeholder = 'Digite seu telefone...';
        }
        
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'p-2 bg-teal-600 text-white rounded-md font-semibold';
        submitButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>`;
        
        form.onsubmit = (e) => {
            e.preventDefault();
            if(input.value.trim()){
                handleConversation({ text: input.value, value: input.value });
            }
        };

        form.appendChild(input);
        form.appendChild(submitButton);
        responseArea.appendChild(form);
        input.focus();
    };

    const showPaymentOptions = () => {
        currentStep = 'confirm';
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'grid grid-cols-2 gap-2';
        const payLocal = document.createElement('button');
        payLocal.className = 'w-full p-2 text-sm text-teal-700 bg-teal-100 dark:text-teal-200 dark:bg-teal-900/50 rounded-lg font-semibold';
        payLocal.textContent = 'Pagar na barbearia';
        payLocal.onclick = () => handleConversation({ text: 'Vou pagar na barbearia', value: 'Pagar na barbearia' });
        
        const payPix = document.createElement('button');
        payPix.className = 'w-full p-2 text-sm text-gray-500 bg-gray-200 rounded-lg font-semibold opacity-50 cursor-not-allowed';
        payPix.textContent = 'Pagar com Pix (breve)';
        payPix.disabled = true;

        optionsContainer.appendChild(payLocal);
        optionsContainer.appendChild(payPix);
        responseArea.appendChild(optionsContainer);
    };

    const showRestartOption = () => {
        currentStep = 'restart';
        const button = document.createElement('button');
        button.className = 'w-full p-2 text-sm text-teal-700 bg-teal-100 dark:text-teal-200 dark:bg-teal-900/50 rounded-lg font-semibold';
        button.textContent = 'Agendar Novo Horário';
        button.onclick = () => {
            chatBody.innerHTML = '';
            handleConversation({ text: 'Quero fazer um novo agendamento' });
        };
        responseArea.appendChild(button);
    };

    const saveAppointment = async () => {
        const newAppointment = {
            service: selection.service,
            date: selection.date,
            time: selection.time,
            clientName: selection.name,
            phone: selection.phone,
            price: appData.services[selection.service] || 0
        };

        try {
            // CORREÇÃO: Usando caminho relativo correto baseado na sua estrutura de pastas
            const response = await fetch('../projeto-gestao/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    acao: 'agendar',
                    ...newAppointment
                }),
            });
            
            const data = await response.json();
            
            if (!data.sucesso) {
                console.error('Erro do backend:', data.mensagem);
                addMessage('bot', 'Ops, tivemos um problema ao registrar seu horário. Por favor, tente novamente mais tarde.');
            }
            // Se o sucesso for true, a mensagem de confirmação já foi exibida na tela.
            
        } catch (error) {
            console.error('Erro de conexão:', error);
            addMessage('bot', 'Estamos com problemas de conexão. Por favor, verifique sua internet.');
        }
    };

    // --- Iniciar Chat ---
    handleConversation();
});
