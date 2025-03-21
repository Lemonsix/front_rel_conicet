export default function Page({ params }: { params: { campaniaId: string } }) {
  const { campaniaId } = params;
  return (
    <div>
      <h1>Campaña {campaniaId}</h1>
    </div>
  )
}