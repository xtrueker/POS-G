import { useCallback } from 'react';
import { toast } from 'sonner';
import { useBusiness } from '@/context/BusinessContext';
import { useSecurity } from '@/context/SecurityContext';
import type { Appointment, Customer } from '@/types';

// Formateador estático para máximo rendimiento de CPU
const DATE_LOCALE = 'es-CO';
const DATE_OPTS: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
const format = (d: string) => new Date(d).toLocaleDateString(DATE_LOCALE, DATE_OPTS).toUpperCase();

/**
 * ENGINE: Enterprise WhatsApp Dispatcher v7.0
 * Optimized for: Performance, Auditability, and Universal Device Compatibility.
 */
export const useWhatsAppEngine = () => {
  const { businessInfo } = useBusiness();
  const { logAudit } = useSecurity();

  // 1. Recordatorio de Cita
  const sendReminder = useCallback(async (apt: Appointment, client: Customer) => {
    const rawPhone = client.phone?.replace(/\D/g, '');
    const phone = rawPhone?.length === 10 ? `57${rawPhone}` : rawPhone;

    if (!phone) {
      toast.error('❌ ERROR: CONTACTO SIN NÚMERO TELEFÓNICO VÁLIDO');
      return;
    }

    const template = [
      `┏━━━━━━━━━━━━━━━━━━━━━┓`,
      `  ✨ ${businessInfo?.legalName?.toUpperCase() || 'SALÓN DE BELLEZA'} ✨`,
      `┗━━━━━━━━━━━━━━━━━━━━━┛`,
      `🔹 HOLA ${client.name.toUpperCase()}`,
      `TE ESPERAMOS PARA TU SERVICIO:`,
      `📌 *${apt.service.toUpperCase()}*`,
      `📅 *DÍA:* ${format(apt.date)}`,
      `⏰ *HORA:* ${apt.time}`,
      `━━━━━━━━━━━━━━━━━━━━━━━`,
      `🛡️ _Favor confirmar asistencia_`,
    ].join('\n');

    const waBase = /Android|iPhone|iPad/i.test(navigator.userAgent) 
      ? 'whatsapp://send' 
      : 'https://web.whatsapp.com/send';

    try {
      const url = `${waBase}?phone=${phone}&text=${encodeURIComponent(template)}`;
      const external = window.open(url, '_blank', 'noopener,noreferrer');

      logAudit({
        action: 'REPORT_EXPORT',
        entityType: 'notification',
        entityId: apt.id,
        description: `LOG: Notificación WhatsApp despachada a +${phone}`,
        severity: 'info'
      });

      if (!external) {
        toast.warning('⚠️ POPUP BLOQUEADO');
      } else {
        toast.success('🚀 MENSAJE ENVIADO');
      }
    } catch (e) {
      toast.error('Error al abrir WhatsApp');
    }
  }, [businessInfo, logAudit]);

  // 2. Confirmación de Venta
  const sendSaleConfirmation = useCallback(async (sale: any, cliente: Customer) => {
    const rawPhone = cliente.phone?.replace(/\D/g, '');
    const phone = rawPhone?.length === 10 ? `57${rawPhone}` : rawPhone;

    if (!phone) return;

    const productNames = sale.products.map((i: any) => i.name).join(', ');
    const totalS = sale.total.toLocaleString('es-CO');
    
    const template = [
      `🛍️ *COMPRA CONFIRMADA* 🛍️`,
      `Hola ${cliente.name}, gracias por tu compra en *${businessInfo?.legalName || 'nuestro salón'}*.`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📦 *Productos:* ${productNames}`,
      `💰 *Total:* $${totalS}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `¡Esperamos verte pronto!`,
    ].join('\n');

    const waBase = /Android|iPhone|iPad/i.test(navigator.userAgent) 
      ? 'whatsapp://send' 
      : 'https://web.whatsapp.com/send';

    const url = `${waBase}?phone=${phone}&text=${encodeURIComponent(template)}`;
    
    toast('📱 ¿Confirmar por WhatsApp?', {
      description: `${cliente.name} — $${totalS}`,
      action: { label: 'ENVIAR', onClick: () => window.open(url, '_blank', 'noopener,noreferrer') },
      duration: 10000,
    });
  }, [businessInfo]);

  // 3. Notificación de Puntos (Elite Beauty)
  const sendLoyaltyUpdate = useCallback(async (cliente: Customer, points: number, totalPoints: number) => {
    const rawPhone = cliente.phone?.replace(/\D/g, '');
    const phone = rawPhone?.length === 10 ? `57${rawPhone}` : rawPhone;

    if (!phone) return;

    const loyaltyConfig = businessInfo?.settings?.loyalty;
    const pName = loyaltyConfig?.pointsName || 'PUNTOS';

    const template = [
      `┏━━━━━━━━━━━━━━━━━━━━━┓`,
      `  💎 *${pName} CLUB* 💎 `,
      `┗━━━━━━━━━━━━━━━━━━━━━┛`,
      `¡HOLA ${cliente.name.toUpperCase()}! 👋`,
      `✨ SUMASTE: *${points} ${pName}* ✨`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🏆 *SALDO TOTAL:* ${totalPoints} ${pName}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `¡GRACIAS POR TU FIDELIDAD EN *${businessInfo?.legalName?.toUpperCase() || 'NUESTRO SALÓN'}*!`,
    ].join('\n');

    const waBase = /Android|iPhone|iPad/i.test(navigator.userAgent) 
      ? 'whatsapp://send' 
      : 'https://web.whatsapp.com/send';

    const url = `${waBase}?phone=${phone}&text=${encodeURIComponent(template)}`;
    
    toast('📱 ¿Notificar saldo de puntos?', {
      description: `${cliente.name} — ${points} pts`,
      action: { label: 'ENVIAR', onClick: () => window.open(url, '_blank', 'noopener,noreferrer') },
      duration: 10000,
    });
  }, [businessInfo]);

  return { sendReminder, sendSaleConfirmation, sendLoyaltyUpdate };
};
