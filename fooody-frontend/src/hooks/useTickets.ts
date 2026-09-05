import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '@/api/ticket.api';

export function useMyTickets() {
  return useQuery({ queryKey: ['tickets', 'mine'], queryFn: () => ticketApi.listMine().then(r=> r.data), refetchInterval: 7000, staleTime: 4000 });
}
export function useTicket(id: string) {
  return useQuery({ queryKey: ['tickets', id], queryFn: () => ticketApi.get(id).then(r=> r.data), enabled: !!id, refetchInterval: 5000 });
}
export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof ticketApi.create>[0]) => ticketApi.create(data).then(r=> r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}
export function useTicketReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => ticketApi.addMessage(id, message).then(r=> r.data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['tickets', vars.id] }),
  });
}
