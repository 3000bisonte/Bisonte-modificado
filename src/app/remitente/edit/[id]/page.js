import FormularioRemitente from "@/components/FormularioRemitente";

const Remitente = ({ params }) => {
  const { id } = params;
  return <FormularioRemitente id={id} />;
};

export default Remitente;
