# Correções de Avisos ESLint

## Problemas de useEffect com dependências faltantes

### Arquivos que precisam de correção:

1. **src/pages/EditEvent.js** - Linha 31
   - Adicionar `useCallback` para `fetchEventDetails`
   - Adicionar dependência no useEffect

2. **src/pages/EventDetails.js** - Linha 53
   - Adicionar `useCallback` para `fetchEventDetails`, `fetchRegistrationStatus`, `fetchStats`
   - Adicionar dependências no useEffect

3. **src/pages/Events.js** - Linhas 48 e 83
   - Adicionar `useCallback` para `fetchEvents`
   - Adicionar dependência no useEffect

4. **src/pages/GuestDetails.js** - Linha 28
   - Adicionar `useCallback` para `fetchGuestDetails`
   - Adicionar dependência no useEffect

5. **src/pages/InviteAccept.js** - Linha 17
   - Adicionar `useCallback` para `validateInvite`
   - Adicionar dependência no useEffect

6. **src/pages/PublicEvent.js** - Linha 51
   - Adicionar `useCallback` para `fetchEventDetails`
   - Adicionar dependência no useEffect

7. **src/pages/admin/Eventos.js** - Linha 19
   - Adicionar `useCallback` para `loadEvents`
   - Adicionar dependência no useEffect

8. **src/components/EventTeam.js** - Linha 15
   - Adicionar `useCallback` para `loadTeamData`
   - Adicionar dependência no useEffect

9. **src/components/FormBuilder.js** - Linha 50
   - Adicionar `useCallback` para `loadFormConfig`
   - Adicionar dependência no useEffect

10. **src/components/PublicPageEditor.js** - Linha 93
    - Adicionar `useCallback` para `loadPageConfig`
    - Adicionar dependência no useEffect

## Imports não utilizados

### Arquivos que precisam de correção:

1. **src/pages/CreateEvent.js** - Linha 5:28 - 'Clock' não utilizado
2. **src/pages/EditEvent.js** - Linha 5:28 - 'Clock' não utilizado
3. **src/pages/EventDetails.js** - Linhas 16, 24, 27 - 'Mail', 'TrendingUp', 'UserX' não utilizados
4. **src/pages/Events.js** - Linha 15:3 - 'MoreVertical' não utilizado
5. **src/pages/GerenciarEquipe.js** - Linhas 10, 11, 14 - 'Shield', 'Calendar', 'Plus' não utilizados
6. **src/pages/GuestDetails.js** - Linha 15:13 - 'QrCodeIcon' não utilizado
7. **src/pages/Guests.js** - Linhas 7, 11, 15, 16 - 'Filter', 'QrCode', 'Calendar', 'MapPin' não utilizados
8. **src/pages/PlanoFaturas.js** - Linhas 6, 14, 15 - 'Calendar', 'Users', 'CalendarDays' não utilizados
9. **src/pages/PublicEvent.js** - Linhas 8, 11, 12, 13, 14 - 'Clock', 'User', 'Mail', 'Phone', 'QrCode' não utilizados
10. **src/pages/admin/Admins.js** - Linha 3:8 - 'ConfirmationModal' não utilizado
11. **src/pages/admin/Dashboard.js** - Linha 7:3 - 'DocumentTextIcon' não utilizado
12. **src/pages/admin/Empresas.js** - Linha 11:3 - 'MagnifyingGlassIcon' não utilizado
13. **src/components/EventTeam.js** - Linha 2:35 - 'Edit' não utilizado
14. **src/components/FormBuilder.js** - Linha 12:3 - 'GripVertical' não utilizado
15. **src/components/FormSettings.js** - Linha 2:10 - 'HexColorPicker' não utilizado
16. **src/components/Layout.js** - Linha 15:3 - 'User' não utilizado
17. **src/components/PublicPageEditor.js** - Linhas 2:10, 17:3 - 'HexColorPicker', 'Trash2' não utilizados

## Variáveis não utilizadas

### Arquivos que precisam de correção:

1. **src/pages/CreateEvent.js** - Linha 20:9 - 'isActive' não utilizado
2. **src/pages/Demandas.js** - Linhas 37:10, 37:20 - 'arquivos', 'setArquivos' não utilizados
3. **src/pages/EditEvent.js** - Linha 27:9 - 'isActive' não utilizado
4. **src/pages/Events.js** - Linhas 36:5, 39:18 - 'handleSubmit', 'errors' não utilizados
5. **src/pages/Guests.js** - Linhas 27:10, 35:10, 36:10 - 'loading', 'customFields', 'formLink' não utilizados
6. **src/pages/PlanoFaturas.js** - Linhas 20:11, 112:13 - 'user', 'response' não utilizados
7. **src/pages/admin/Admins.js** - Linhas 9:10, 12:18 - 'editAdmin', 'setSaving' não utilizados
8. **src/pages/admin/Eventos.js** - Linha 61:9 - 'formatDateTime' não utilizado
9. **src/components/Layout.js** - Linha 62:9 - 'textMenuActive' não utilizado

## Como aplicar as correções:

1. Para useEffect: Adicionar `useCallback` e incluir a função nas dependências
2. Para imports não utilizados: Remover os imports desnecessários
3. Para variáveis não utilizadas: Remover as declarações ou usar as variáveis
4. Para href inválidos: Substituir por `button` com `type="button"`

## Exemplo de correção para useEffect:

```javascript
// Antes
useEffect(() => {
  fetchData();
}, [eventId]);

const fetchData = async () => {
  // ...
};

// Depois
const fetchData = useCallback(async () => {
  // ...
}, [eventId]);

useEffect(() => {
  fetchData();
}, [fetchData]);
``` 