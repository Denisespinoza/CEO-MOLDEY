export type TaskType =
  | 'lanzamiento_pack' | 'molde_individual' | 'campana_marketing'
  | 'publicacion_redes' | 'oferta_especial' | 'molde_gratis'
  | 'revision_tecnica' | 'preparacion_archivos' | 'diseno_visual'
  | 'comunicacion' | 'analisis_ventas' | 'mejora_producto'
  | 'relanzamiento' | 'diseno_pedido' | 'pedido_personalizado'
  | 'correccion_cliente' | 'entrega_archivos' | 'seguimiento_post'
  | 'pedido_premium' | 'adaptacion_molde' | 'escalado_talles'
  | 'conversion_formato';

export type KanbanColumn =
  | 'ideas' | 'planificacion' | 'pedido_recibido' | 'produccion_digital'
  | 'diseno_pedido' | 'revision_tecnica' | 'listo_publicar'
  | 'campana_activa' | 'publicado' | 'medir_resultados' | 'mejorar_relanzar';

export type Priority = 'baja' | 'media' | 'alta' | 'urgente';
export type PaymentStatus = 'pendiente' | 'parcial' | 'pagado' | 'cancelado';
export type DeliveryStatus = 'pendiente' | 'en_proceso' | 'entregado' | 'con_correcciones';

export type Category = 'dama' | 'hombre' | 'nino' | 'nina' | 'bebe' | 'unisex' | 'temporada' | 'otros';

export type MarketingChannel = 'instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'telegram' | 'email' | 'sitio_web' | 'google_drive' | 'mercadolibre' | 'otros';
export type SaleChannel = 'sitio_web' | 'whatsapp' | 'telegram' | 'mercado_pago' | 'paypal' | 'crypto' | 'hotmart' | 'gumroad' | 'otro';

export interface ProductionChecklist {
  molde_terminado: boolean;
  talles_revisados: boolean;
  pdf_a4: boolean;
  pdf_plotter: boolean;
  cdr: boolean;
  dxf: boolean;
  plt: boolean;
  pds: boolean;
  mrk: boolean;
  imagen_portada: boolean;
  fotos_mockups: boolean;
  descripcion_comercial: boolean;
  precio_definido: boolean;
  prueba_descarga: boolean;
  producto_publicado: boolean;
  link_descarga_probado: boolean;
  archivos_verificados: boolean;
}

export interface MoldeyTask {
  id: string;
  title: string;
  description: string;
  task_type: TaskType;
  status: KanbanColumn;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  launch_date: string | null;
  delivery_date: string | null;
  responsible: string;
  client_name: string;
  client_contact: string;
  category: Category | null;
  related_product: string;
  related_pack: string;
  sale_channels: SaleChannel[];
  marketing_channels: MarketingChannel[];
  estimated_price: number;
  final_price: number;
  advance_payment: number;
  balance: number;
  sales_goal: number;
  sales_result: number;
  pending_files: string;
  completed_files: string;
  internal_notes: string;
  client_notes: string;
  reference_link: string;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  checklist: ProductionChecklist;
  created_at: string;
  updated_at: string;
}

export interface MoldeyLaunch {
  id: string;
  name: string;
  type: 'pack' | 'molde_individual' | 'oferta' | 'gratis' | 'premium';
  target_date: string | null;
  status: 'planificado' | 'atrasado' | 'listo' | 'publicado' | 'necesita_campana' | 'relanzar';
  price: number;
  sales_goal: number;
  related_campaign: string;
  products_included: string;
  pending_files: string;
  notes: string;
  created_at: string;
}

export interface MoldeyLaunchStatus {
  value: MoldeyLaunch['status'];
  label: string;
  color: string;
}

export interface MoldeyCampaign {
  id: string;
  name: string;
  promoted_product: string;
  start_date: string | null;
  end_date: string | null;
  main_channel: MarketingChannel | null;
  secondary_channels: MarketingChannel[];
  offer: string;
  main_message: string;
  sales_goal: number;
  final_result: number;
  status: 'borrador' | 'programada' | 'activa' | 'pausada' | 'finalizada' | 'mejorar_repetir';
  created_at: string;
}

export interface MoldeyCustomOrder {
  id: string;
  client_name: string;
  client_contact: string;
  order_name: string;
  garment_type: string;
  category: Category | null;
  description: string;
  client_references: string;
  requested_sizes: string;
  requested_formats: string;
  order_date: string | null;
  promised_delivery: string | null;
  price: number;
  advance: number;
  balance: number;
  payment_status: PaymentStatus;
  status: 'consulta' | 'analisis' | 'presupuesto_enviado' | 'esperando_confirmacion' | 'aprobado' | 'en_produccion' | 'revision_tecnica' | 'listo_entregar' | 'entregado' | 'correccion' | 'finalizado' | 'cancelado';
  final_files: string;
  internal_notes: string;
  client_notes: string;
  created_at: string;
}

export interface MoldeyFreeProduct {
  id: string;
  name: string;
  category: Category | null;
  formats: string[];
  file_status: 'pendiente' | 'en_proceso' | 'listo';
  download_link: string;
  related_campaign: string;
  objective: 'captar_clientes' | 'generar_confianza' | 'traer_trafico' | 'probar_calidad' | 'otro';
  publish_date: string | null;
  result: string;
  next_action: string;
  created_at: string;
}

export const KANBAN_COLUMNS: { id: KanbanColumn; label: string; color: string }[] = [
  { id: 'ideas', label: 'Ideas', color: 'bg-carbon-700 border-carbon-600' },
  { id: 'planificacion', label: 'En planificación', color: 'bg-navy-700 border-navy-600' },
  { id: 'pedido_recibido', label: 'Pedido recibido', color: 'bg-blue-900/40 border-blue-700/40' },
  { id: 'produccion_digital', label: 'En producción digital', color: 'bg-violet-900/30 border-violet-700/30' },
  { id: 'diseno_pedido', label: 'En diseño a pedido', color: 'bg-indigo-900/30 border-indigo-700/30' },
  { id: 'revision_tecnica', label: 'En revisión técnica', color: 'bg-amber-900/20 border-amber-700/30' },
  { id: 'listo_publicar', label: 'Listo para publicar', color: 'bg-emerald-900/20 border-emerald-700/30' },
  { id: 'campana_activa', label: 'Campaña activa', color: 'bg-yellow-900/10 border-yellow-600/30' },
  { id: 'publicado', label: 'Publicado / entregado', color: 'bg-green-900/20 border-green-700/30' },
  { id: 'medir_resultados', label: 'Medir resultados', color: 'bg-cyan-900/20 border-cyan-700/30' },
  { id: 'mejorar_relanzar', label: 'Mejorar / relanzar', color: 'bg-orange-900/20 border-orange-700/30' },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  baja: { label: 'Baja', color: 'text-carbon-400', dot: 'bg-carbon-400' },
  media: { label: 'Media', color: 'text-blue-400', dot: 'bg-blue-400' },
  alta: { label: 'Alta', color: 'text-amber-400', dot: 'bg-amber-400' },
  urgente: { label: 'Urgente', color: 'text-red-400', dot: 'bg-red-400' },
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  lanzamiento_pack: 'Lanzamiento de pack',
  molde_individual: 'Molde individual',
  campana_marketing: 'Campaña de marketing',
  publicacion_redes: 'Publicación en redes',
  oferta_especial: 'Oferta especial',
  molde_gratis: 'Molde gratis',
  revision_tecnica: 'Revisión técnica',
  preparacion_archivos: 'Preparación de archivos',
  diseno_visual: 'Diseño visual / mockup',
  comunicacion: 'Email / WhatsApp / Telegram',
  analisis_ventas: 'Análisis de ventas',
  mejora_producto: 'Mejora de producto',
  relanzamiento: 'Relanzamiento',
  diseno_pedido: 'Diseño a pedido',
  pedido_personalizado: 'Pedido personalizado',
  correccion_cliente: 'Corrección solicitada',
  entrega_archivos: 'Entrega de archivos',
  seguimiento_post: 'Seguimiento post-entrega',
  pedido_premium: 'Pedido premium',
  adaptacion_molde: 'Adaptación de molde',
  escalado_talles: 'Escalado de talles',
  conversion_formato: 'Conversión de formato',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  dama: 'Dama',
  hombre: 'Hombre',
  nino: 'Niño',
  nina: 'Niña',
  bebe: 'Bebé',
  unisex: 'Unisex',
  temporada: 'Temporada',
  otros: 'Otros',
};

export const MARKETING_CHANNELS: { value: MarketingChannel; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: 'Email' },
  { value: 'sitio_web', label: 'Sitio web' },
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'mercadolibre', label: 'MercadoLibre' },
  { value: 'otros', label: 'Otros' },
];

export const SALE_CHANNELS: { value: SaleChannel; label: string }[] = [
  { value: 'sitio_web', label: 'Sitio web Moldey' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'crypto', label: 'Binance / Cripto' },
  { value: 'hotmart', label: 'Hotmart' },
  { value: 'gumroad', label: 'Gumroad' },
  { value: 'otro', label: 'Otro' },
];

export const EMPTY_CHECKLIST: ProductionChecklist = {
  molde_terminado: false, talles_revisados: false, pdf_a4: false,
  pdf_plotter: false, cdr: false, dxf: false, plt: false, pds: false,
  mrk: false, imagen_portada: false, fotos_mockups: false,
  descripcion_comercial: false, precio_definido: false,
  prueba_descarga: false, producto_publicado: false,
  link_descarga_probado: false, archivos_verificados: false,
};

export const CHECKLIST_LABELS: Record<keyof ProductionChecklist, string> = {
  molde_terminado: 'Molde terminado',
  talles_revisados: 'Talles revisados',
  pdf_a4: 'PDF A4',
  pdf_plotter: 'PDF Plotter',
  cdr: 'CDR',
  dxf: 'DXF',
  plt: 'PLT',
  pds: 'PDS',
  mrk: 'MRK',
  imagen_portada: 'Imagen de portada',
  fotos_mockups: 'Fotos / Mockups',
  descripcion_comercial: 'Descripción comercial',
  precio_definido: 'Precio definido',
  prueba_descarga: 'Prueba de descarga',
  producto_publicado: 'Producto publicado',
  link_descarga_probado: 'Link de descarga probado',
  archivos_verificados: 'Archivos verificados',
};

export const EMPTY_TASK: Omit<MoldeyTask, 'id' | 'created_at' | 'updated_at'> = {
  title: '', description: '', task_type: 'lanzamiento_pack',
  status: 'ideas', priority: 'media', start_date: null, due_date: null,
  launch_date: null, delivery_date: null, responsible: '', client_name: '',
  client_contact: '', category: null, related_product: '', related_pack: '',
  sale_channels: [], marketing_channels: [], estimated_price: 0,
  final_price: 0, advance_payment: 0, balance: 0, sales_goal: 0,
  sales_result: 0, pending_files: '', completed_files: '', internal_notes: '',
  client_notes: '', reference_link: '', payment_status: 'pendiente',
  delivery_status: 'pendiente', checklist: { ...EMPTY_CHECKLIST },
};
