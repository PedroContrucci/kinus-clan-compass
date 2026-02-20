// tripPdfExport — Generate PDF summary of a trip using jsPDF

import jsPDF from 'jspdf';
import type { SavedTrip } from '@/types/trip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function exportTripPDF(trip: SavedTrip) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const addSection = (title: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    y += 6;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, y);
    y += 2;
    doc.setDrawColor(16, 185, 129);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
  };

  const addText = (text: string, indent = 14) => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - indent - 14);
    doc.text(lines, indent, y);
    y += lines.length * 5;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`KINU — ${trip.destination}`, 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const dateRange = trip.startDate && trip.endDate
    ? `${format(new Date(trip.startDate), "dd MMM yyyy", { locale: ptBR })} – ${format(new Date(trip.endDate), "dd MMM yyyy", { locale: ptBR })}`
    : '';
  doc.text(`${trip.country} • ${dateRange} • ${trip.travelers} viajante(s)`, 14, y);
  doc.setTextColor(0);
  y += 10;

  // Financial Summary
  addSection('💰 Resumo Financeiro');
  addText(`Orçamento total: R$ ${fmt(trip.finances.total)}`);
  addText(`Confirmado: R$ ${fmt(trip.finances.confirmed)}`);
  addText(`Planejado: R$ ${fmt(trip.finances.planned)}`);
  addText(`Disponível: R$ ${fmt(trip.finances.available)}`);

  // Flight & Hotel
  addSection('✈️ Voo & 🏨 Hotel');
  if (trip.flights?.outbound) {
    const f = trip.flights.outbound;
    addText(`Voo: ${f.origin} → ${f.destination} • Status: ${f.status === 'confirmed' ? 'Confirmado' : 'Planejado'} • R$ ${fmt(f.price)}`);
  }
  if (trip.accommodation) {
    const a = trip.accommodation;
    addText(`Hotel: ${a.name} • ${a.totalNights} noites • Status: ${a.status === 'confirmed' ? 'Confirmado' : 'Planejado'} • R$ ${fmt(a.totalPrice)}`);
  }

  // Itinerary
  addSection('📋 Roteiro');
  (trip.days || []).forEach((day) => {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dia ${day.day}: ${day.title}`, 14, y);
    y += 5;
    (day.activities || []).forEach((act) => {
      addText(`${act.time} — ${act.name}${act.cost > 0 ? ` (R$ ${fmt(act.cost)})` : ''}`, 18);
    });
    y += 2;
  });

  // Checklist
  addSection('✅ Checklist');
  (trip.checklist || []).forEach((item) => {
    addText(`${item.checked ? '☑' : '☐'} ${item.label}`, 16);
  });

  // Save
  const safeDest = trip.destination.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = trip.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : 'viagem';
  doc.save(`KINU_${safeDest}_${dateStr}.pdf`);
}
