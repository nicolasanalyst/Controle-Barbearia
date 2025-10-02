-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 02/10/2025 às 05:41
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `barbearia_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `agendamentos`
--

CREATE TABLE `agendamentos` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `servico` varchar(255) NOT NULL,
  `data_agendamento` date NOT NULL,
  `hora_agendamento` time NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `status` varchar(50) DEFAULT 'Agendado',
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `agendamentos`
--

INSERT INTO `agendamentos` (`id`, `cliente_id`, `servico`, `data_agendamento`, `hora_agendamento`, `valor`, `status`, `data_criacao`) VALUES
(1, 3, 'Corte de Cabelo', '2025-09-22', '09:00:00', 40.00, 'Agendado', '2025-09-21 19:35:22'),
(4, 2, 'Corte de Cabelo', '2025-09-24', '11:00:00', 40.00, 'Agendado', '2025-09-21 19:35:22'),
(5, 5, 'Corte de Cabelo', '2025-09-22', '10:00:00', 40.00, 'Agendado', '2025-09-21 19:42:44'),
(13, 5, 'Corte de Cabelo', '2025-09-23', '09:00:00', 40.00, 'Agendado', '2025-09-22 22:56:18'),
(14, 5, 'Corte de Cabelo', '2025-09-24', '11:30:00', 40.00, 'Agendado', '2025-09-23 00:10:19'),
(15, 12, 'Corte de Cabelo', '2025-09-24', '09:00:00', 40.00, 'Agendado', '2025-09-23 00:28:55'),
(16, 13, 'Corte de Cabelo', '2025-09-30', '09:00:00', 40.00, 'Agendado', '2025-09-23 01:33:13'),
(17, 14, 'Corte de Cabelo', '2025-09-24', '09:30:00', 40.00, 'Agendado', '2025-09-23 23:18:34'),
(18, 15, 'Cabelo + Barba', '2025-09-24', '10:00:00', 65.00, 'Agendado', '2025-09-23 23:22:47'),
(19, 16, 'Corte de Cabelo', '2025-10-03', '09:00:00', 40.00, 'Agendado', '2025-09-26 00:44:20'),
(20, 17, 'Corte de Cabelo', '2025-09-29', '10:00:00', 40.00, 'Agendado', '2025-09-26 00:46:59'),
(23, 5, 'Corte de Cabelo', '2025-10-01', '10:00:00', 40.00, 'Agendado', '2025-09-30 00:25:21'),
(24, 20, 'Corte de Cabelo', '2025-10-10', '09:00:00', 40.00, 'Agendado', '2025-10-01 00:41:49'),
(25, 21, 'Platinado', '2025-10-11', '09:00:00', 150.00, 'Agendado', '2025-10-01 00:52:02'),
(26, 22, 'Barba', '2025-11-01', '09:00:00', 30.00, 'Agendado', '2025-10-01 00:53:18'),
(27, 23, 'Platinado', '2025-10-18', '09:00:00', 150.00, 'Agendado', '2025-10-01 23:05:37'),
(28, 24, 'Corte de Cabelo', '2025-10-03', '09:30:00', 40.00, 'Agendado', '2025-10-02 02:05:29'),
(29, 5, 'Corte de Cabelo', '2025-10-03', '10:00:00', 40.00, 'Agendado', '2025-10-02 03:09:34');

-- --------------------------------------------------------

--
-- Estrutura para tabela `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `clientes`
--

INSERT INTO `clientes` (`id`, `nome`, `telefone`, `data_criacao`) VALUES
(2, 'Carlos Souza', '(19) 91234-5678', '2025-09-21 19:35:21'),
(3, 'Mariana Costa', '(19) 98765-4321', '2025-09-21 19:35:21'),
(5, 'Nicolas Villela', '19989132951', '2025-09-21 19:42:44'),
(12, 'Cesar', '19999170514', '2025-09-23 00:28:55'),
(13, 'gabriel', '1212121212', '2025-09-23 01:33:13'),
(14, 'josias', '212121212', '2025-09-23 23:18:34'),
(15, 'josias', '7777777777', '2025-09-23 23:22:47'),
(16, 'NICK', '21211212122', '2025-09-26 00:44:20'),
(17, 'Nicolas', '1212112122', '2025-09-26 00:46:59'),
(19, 'rffrffrffr', 'edededed', '2025-09-26 01:17:03'),
(20, 'ppppppppppppp', '66666666666', '2025-10-01 00:41:49'),
(21, 'daniel', '197575142', '2025-10-01 00:52:02'),
(22, 'nicolas silva', '19993339597', '2025-10-01 00:53:18'),
(23, 'Daniel', '77777777777', '2025-10-01 23:05:37'),
(24, 'Nicolas', '1993339597', '2025-10-02 02:05:29');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `agendamentos`
--
ALTER TABLE `agendamentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- Índices de tabela `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `telefone` (`telefone`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `agendamentos`
--
ALTER TABLE `agendamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de tabela `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `agendamentos`
--
ALTER TABLE `agendamentos`
  ADD CONSTRAINT `agendamentos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
