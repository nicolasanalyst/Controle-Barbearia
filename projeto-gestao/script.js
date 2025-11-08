document.addEventListener('DOMContentLoaded', () => {
    
    const appState = {
        clients: [],
        appointments: []
    };
    
    let revenueChartInstance = null;

    const loginScreen = document.getElementById('screen-login');
    const appScreen = document.getElementById('screen-app');
    const loginButton = document.getElementById('login-button');
    const mainContent = document.getElementById('main-content');
    const navButtons = document.querySelectorAll('.nav-button');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const agendamentoModal = document.getElementById('agendamento-modal');
    const agendamentoForm = document.getElementById('agendamento-form');
    const logoutButtons = document.querySelectorAll('.logout-button');

    async function loadAllData() {
        try {
            const response = await fetch('api.php?acao=getAllData');
            const result = await response.json();
            if (result.sucesso) {
                appState.clients = result.dados.clientes;
                appState.appointments = result.dados.agendamentos;
            } else {
                console.error('Falha ao carregar dados:', result.mensagem);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            mainContent.innerHTML = '<p class="text-center text-red-500">Erro de conexão com o servidor.</p>';
        }
    }
    
    async function deleteAppointment(appointmentId) {
        if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) {
            return;
        }
        try {
            const response = await fetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    acao: 'excluirAgendamento',
                    agendamento_id: appointmentId
                })
            });
            const result = await response.json();
            if (result.sucesso) {
                appState.appointments = appState.appointments.filter(a => a.id !== appointmentId);
                const currentPage = document.querySelector('.nav-button.bg-teal-600').dataset.page;
                showPage(currentPage);
            } else {
                alert(`Erro ao excluir: ${result.mensagem || 'Tente novamente.'}`);
            }
        } catch (error) {
            console.error('Erro na requisição de exclusão:', error);
            alert('Erro de conexão ao tentar excluir.');
        }
    }

    async function handleAgendamentoSubmit(event) {
        event.preventDefault();
        const formData = new FormData(agendamentoForm);
        const data = Object.fromEntries(formData.entries());

        const payload = {
            acao: 'agendar',
            ...data
        };

        try {
            const response = await fetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.sucesso) {
                const { novoAgendamento, cliente } = result.dados;
                appState.appointments.push(novoAgendamento);
                
                const clienteExiste = appState.clients.some(c => c.id === cliente.id);
                if (!clienteExiste) {
                    appState.clients.push(cliente);
                }
                
                agendamentoModal.classList.add('hidden');
                agendamentoForm.reset();

                const currentPageId = document.querySelector('.nav-button.bg-teal-600').dataset.page;
                showPage(currentPageId);
                
            } else {
                alert(`Erro: ${result.mensagem}`);
            }
        } catch (error) {
            console.error('Erro ao agendar:', error);
            alert('Não foi possível conectar ao servidor para agendar.');
        }
    }

    const showPage = (pageId) => {
        if (revenueChartInstance) {
            revenueChartInstance.destroy();
            revenueChartInstance = null;
        }

        const template = document.getElementById(`template-${pageId}`);
        if (template) {
            mainContent.innerHTML = template.innerHTML;
        }
        navButtons.forEach(btn => {
            const isActive = btn.dataset.page === pageId;
            btn.classList.toggle('bg-teal-600', isActive); 
            btn.classList.toggle('dark:bg-teal-500', isActive); 
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('text-gray-600', !isActive); 
            btn.classList.toggle('dark:text-gray-300', !isActive);
            btn.classList.toggle('text-teal-600', isActive);
            btn.classList.toggle('dark:text-teal-400', isActive);
            btn.classList.toggle('text-gray-500', !isActive);
            btn.classList.toggle('dark:text-gray-400', !isActive);
        });

        if (pageId === 'page-dashboard') renderDashboard();
        if (pageId === 'page-agenda') renderAgenda();
        if (pageId === 'page-clientes') renderClientList();
        if (pageId === 'page-relatorios') renderReports();
    };

    const formatCurrency = (value) => `R$ ${(parseFloat(value || 0)).toFixed(2).replace('.', ',')}`;

    const renderDashboard = () => {
        const appointmentsTodayEl = document.getElementById('dashboard-appointments-today');
        const revenueTodayEl = document.getElementById('dashboard-revenue-today');
        const totalClientsEl = document.getElementById('dashboard-total-clients');
        const nextClientContainer = document.getElementById('dashboard-next-client');

        const todayStr = new Date().toISOString().split('T')[0];
        
        const appointmentsToday = appState.appointments.filter(app => app.data_agendamento === todayStr);
        const revenueToday = appointmentsToday.reduce((sum, app) => sum + parseFloat(app.valor), 0);
        
        if (appointmentsTodayEl) appointmentsTodayEl.textContent = appointmentsToday.length;
        if (revenueTodayEl) revenueTodayEl.textContent = formatCurrency(revenueToday);
        if (totalClientsEl) totalClientsEl.textContent = appState.clients.length;

        if (nextClientContainer) {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            const nextAppointment = appointmentsToday
                .filter(app => app.hora_agendamento > currentTime)
                .sort((a, b) => a.hora_agendamento.localeCompare(b.hora_agendamento))[0];
            
            if (nextAppointment) {
                
                const client = appState.clients.find(c => c.id === nextAppointment.cliente_id);
                const clientName = client ? client.nome : 'Cliente';

                nextClientContainer.innerHTML = `<h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">PRÓXIMO CLIENTE</h2><div class="flex items-center space-x-4"><div><p class="font-bold text-lg text-gray-900 dark:text-gray-100">${clientName}</p><p class="text-gray-600 dark:text-gray-300">${nextAppointment.hora_agendamento.substring(0,5)} - ${nextAppointment.servico}</p></div></div>`;
            } else {
                nextClientContainer.innerHTML = `<h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">AGENDAMENTOS</h2><p class="text-gray-600 dark:text-gray-300 mt-4">Nenhum próximo agendamento para hoje.</p>`;
            }
        }
    };

    const renderAgenda = () => {
        const datePicker = document.getElementById('agenda-date-picker');
        const container = document.getElementById('agenda-content-container');
        if (!datePicker || !container) return;
        
        datePicker.value = new Date().toISOString().split('T')[0];
        
        const updateAgendaView = () => {
            const selectedDate = datePicker.value;
            const appointmentsForDay = appState.appointments.filter(app => app.data_agendamento === selectedDate)
                .sort((a, b) => a.hora_agendamento.localeCompare(b.hora_agendamento));
            
            container.innerHTML = '';
            if (appointmentsForDay.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 p-8">Nenhum agendamento para esta data.</p>';
                return;
            }
            const list = document.createElement('ul');
            list.className = 'space-y-3';
            appointmentsForDay.forEach(app => {
                
                const client = appState.clients.find(c => c.id === app.cliente_id);
                const clientName = client ? client.nome : 'Cliente';

                const item = document.createElement('li');
                item.className = 'flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg';
                item.innerHTML = `
                    <div class="w-20 text-lg font-bold text-teal-600 dark:text-teal-400">${app.hora_agendamento.substring(0,5)}</div>
                    <div class="flex-1 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                        <p class="font-semibold text-gray-800 dark:text-gray-200">${clientName}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${app.servico} - ${formatCurrency(app.valor)}</p>
                    </div>
                    <button class="delete-button ml-4 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors" data-appointment-id="${app.id}">
                        <svg class="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="pointer-events: none;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `;
                list.appendChild(item);
            });
            container.appendChild(list);
        };
        
        container.addEventListener('click', (event) => {
            const deleteButton = event.target.closest('.delete-button');
            if (deleteButton) {
                const appointmentId = parseInt(deleteButton.dataset.appointmentId, 10);
                if (appointmentId) {
                    deleteAppointment(appointmentId);
                }
            }
        });

        datePicker.addEventListener('change', updateAgendaView);
        document.getElementById('open-agendamento-modal-btn').addEventListener('click', () => {
            agendamentoModal.classList.remove('hidden');
            agendamentoForm.elements.date.value = document.getElementById('agenda-date-picker').value;
        });
        document.getElementById('close-agendamento-modal-btn').addEventListener('click', () => {
            agendamentoModal.classList.add('hidden');
        });
        agendamentoForm.elements.service.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            agendamentoForm.elements.price.value = selectedOption.dataset.price;
        });
        updateAgendaView();
    };

    const renderClientList = () => {
        const container = document.getElementById('client-list-container');
        if (!container) return;
        container.innerHTML = '';
        if (appState.clients.length === 0) {
            container.innerHTML = `<li class="p-4 text-center text-gray-500 dark:text-gray-400">Nenhum cliente cadastrado.</li>`;
            return;
        }
        appState.clients.forEach(client => {
            const li = document.createElement('li');
            li.className = 'p-4 flex justify-between items-center';
            li.innerHTML = `<div><p class="font-semibold text-gray-800 dark:text-gray-200">${client.nome}</p><p class="text-sm text-gray-500 dark:text-gray-400">${client.telefone}</p></div>`;
            container.appendChild(li);
        });
    };
    
    const renderReports = async () => {
        try {
            const response = await fetch('api.php?acao=getRelatorios');
            const result = await response.json();
            if(!result.sucesso) throw new Error(result.mensagem || 'Falha ao buscar dados do relatório.');

            const data = result.dados;
            
            document.getElementById('report-daily-revenue').textContent = formatCurrency(data.hoje.faturamento_previsto);
            document.getElementById('report-daily-count').textContent = `${data.hoje.total_agendamentos || 0} agendamentos`;
            document.getElementById('report-weekly-revenue').textContent = formatCurrency(data.semana.faturamento_previsto);
            document.getElementById('report-weekly-count').textContent = `${data.semana.total_agendamentos || 0} agendamentos`;
            document.getElementById('report-monthly-revenue').textContent = formatCurrency(data.mes.faturamento_previsto);
            document.getElementById('report-monthly-count').textContent = `${data.mes.total_agendamentos || 0} agendamentos`;

            const chartCtx = document.getElementById('revenue-chart').getContext('2d');
            const labels = data.grafico.map(item => new Date(item.dia + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}));
            const chartData = data.grafico.map(item => parseFloat(item.faturamento));

            revenueChartInstance = new Chart(chartCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Faturamento',
                        data: chartData,
                        backgroundColor: 'rgba(20, 184, 166, 0.6)',
                        borderColor: 'rgba(13, 148, 136, 1)',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                }
            });
        } catch(error) {
            console.error("Erro ao renderizar relatórios:", error);
            mainContent.innerHTML += "<p class='text-red-500'>Não foi possível carregar os dados do relatório.</p>"
        }
    };

    loginButton.addEventListener('click', async () => {
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        appScreen.classList.add('md:flex');
        await loadAllData();
        showPage('page-dashboard');
    });

    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            appScreen.classList.add('hidden');
            appScreen.classList.remove('md:flex');
            loginScreen.classList.remove('hidden');
        });
    });

    navButtons.forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
    
    themeToggleButton.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    agendamentoForm.addEventListener('submit', handleAgendamentoSubmit);
});

