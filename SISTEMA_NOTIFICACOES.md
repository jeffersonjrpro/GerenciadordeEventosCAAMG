# 🔔 Sistema de Notificações - Documentação

## 📋 Visão Geral

O sistema de notificações do Gerenciador de Eventos CAAMG é **automatizado** e funciona em tempo real, enviando lembretes de agendamentos no momento correto.

## ⚙️ Como Funciona

### **1. Scheduler Automático**
- ✅ **Verificação a cada minuto** - O sistema verifica agendamentos automaticamente
- ✅ **Criação automática** - Notificações são criadas no momento correto
- ✅ **Sem configuração manual** - Funciona automaticamente após instalação

### **2. Fluxo de Notificações**
```
Agendamento Criado → Scheduler Verifica → Notificação Criada → Usuário Vê no Sino
```

### **3. Configuração Automática**
O scheduler é iniciado automaticamente quando o servidor sobe:
```
🚀 Iniciando scheduler de notificações...
✅ Scheduler iniciado - verificando notificações a cada minuto
```

## 🔧 Configuração

### **Instalação da Dependência**
```bash
cd backend
npm install node-cron
```

### **Verificação de Funcionamento**
Nos logs do servidor deve aparecer:
```
🔍 Verificando agendamentos para notificação: [DATA_HORA]
📅 Encontrados X agendamentos para verificar
```

## 📊 Estrutura das Notificações

### **Campos da Notificação**
```json
{
  "id": "uuid",
  "userId": "id_do_usuario",
  "titulo": "Lembrete de Agendamento",
  "mensagem": "Seu agendamento 'Reunião' começa em 30 minutos",
  "tipo": "LEMBRETE_AGENDAMENTO",
  "dados": {
    "agendamentoId": "id_do_agendamento",
    "tituloAgendamento": "Título do Agendamento",
    "dataInicio": "2024-01-01T10:00:00Z"
  },
  "lida": false,
  "criadoEm": "2024-01-01T09:30:00Z"
}
```

### **Tipos de Notificação**
- `LEMBRETE_AGENDAMENTO` - Lembretes de agendamentos
- `NOTIFICACAO_MANUAL` - Notificações enviadas manualmente

## 🎯 Funcionalidades

### **1. Lembretes Automáticos**
- ✅ **Configurável** - X minutos antes do agendamento
- ✅ **Personalizado** - Por usuário e agendamento
- ✅ **Persistente** - Salvo no banco de dados

### **2. Interface do Usuário**
- ✅ **Sino de notificações** - Ícone no cabeçalho
- ✅ **Contador de não lidas** - Número de notificações
- ✅ **Lista de notificações** - Todas as notificações
- ✅ **Marcar como lida** - Clique para marcar

### **3. Notificações em Tempo Real**
- ✅ **Atualização automática** - Sem precisar recarregar
- ✅ **Contador dinâmico** - Atualiza automaticamente
- ✅ **Interface responsiva** - Funciona em mobile

## 🛠️ Solução de Problemas

### **Notificações não aparecem**
1. Verificar se o scheduler está rodando:
   ```
   🚀 Iniciando scheduler de notificações...
   ✅ Scheduler iniciado - verificando notificações a cada minuto
   ```

2. Verificar logs do scheduler:
   ```
   🔍 Verificando agendamentos para notificação: [DATA]
   📅 Encontrados X agendamentos para verificar
   ```

3. Verificar se há agendamentos próximos:
   ```sql
   SELECT * FROM agendamentos 
   WHERE dataInicio > NOW() 
   AND dataInicio <= NOW() + INTERVAL '1 hour'
   ```

### **Scheduler não inicia**
1. Verificar se `node-cron` está instalado:
   ```bash
   npm list node-cron
   ```

2. Verificar se o servidor está rodando:
   ```bash
   curl http://localhost:5000/api/health
   ```

### **Notificações duplicadas**
- O sistema evita duplicatas automaticamente
- Verificar se há múltiplas instâncias do servidor rodando

## 📈 Monitoramento

### **Logs do Scheduler**
```
🔍 Verificando agendamentos para notificação: 2024-01-01T10:00:00Z
📅 Encontrados 2 agendamentos para verificar
✅ Notificação criada para: Reunião (ID: 123)
✅ Notificação criada para: Tarefa (ID: 456)
```

### **Verificação Manual**
```bash
# Verificar notificações no banco
cd backend
npx prisma studio

# Ou via SQL
psql -d gerenciador_eventos -c "SELECT * FROM notifications ORDER BY criadoEm DESC LIMIT 10;"
```

## 🔄 Manutenção

### **Reiniciar Scheduler**
```bash
# Reiniciar servidor
cd backend
npm run dev
```

### **Limpar Notificações Antigas**
```sql
-- Remover notificações mais antigas que 30 dias
DELETE FROM notifications 
WHERE criadoEm < NOW() - INTERVAL '30 days';
```

## 📝 Notas Importantes

### **Performance**
- ✅ **Verificação eficiente** - Apenas agendamentos próximos
- ✅ **Índices otimizados** - Consultas rápidas
- ✅ **Baixo uso de recursos** - Verificação a cada minuto

### **Segurança**
- ✅ **Validação de dados** - Dados sanitizados
- ✅ **Controle de acesso** - Apenas usuário próprio
- ✅ **Logs de auditoria** - Rastreamento completo

### **Escalabilidade**
- ✅ **Suporte a múltiplos usuários** - Cada usuário vê suas notificações
- ✅ **Sistema distribuído** - Funciona em múltiplos servidores
- ✅ **Configuração flexível** - Fácil adaptação

---

**Última atualização**: Janeiro 2024
**Versão**: 1.0
**Status**: ✅ Funcionando 