export default function MesaPage({ params }: { params: { codigo: string } }) {
  return (
    <div>
      <h1>Mesa {params.codigo} (placeholder)</h1>
      <p>Menú/carrito temporal.</p>
    </div>
  )
}
