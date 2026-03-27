import { useAuth } from '../state/auth.jsx';
import ResumenOposicionWidget from '../components/widgets/ResumenOposicionWidget';
import ConfigurarOposicionWidget from '../components/widgets/ConfigurarOposicionWidget';
import TestRecomendadoWidget from '../components/widgets/TestRecomendadoWidget';
import FocoHoyWidget from '../components/widgets/FocoHoyWidget';
import ResumenSemanaWidget from '../components/widgets/ResumenSemanaWidget';
import Actividad14Widget from '../components/widgets/Actividad14Widget';
import TemasDebilesWidget from '../components/widgets/TemasDebilesWidget';
import InsightMensualWidget from '../components/widgets/InsightMensualWidget';
import RendimientoModosWidget from '../components/widgets/RendimientoModosWidget';
import ProgresoSemanalWidget from '../components/widgets/ProgresoSemanalWidget';
import EficienciaWidget from '../components/widgets/EficienciaWidget';
import ConsistenciaDiariaWidget from '../components/widgets/ConsistenciaDiariaWidget';
import RitmoPreguntaWidget from '../components/widgets/RitmoPreguntaWidget';
import BalancePrecisionWidget from '../components/widgets/BalancePrecisionWidget';
import TuNivelWidget from '../components/widgets/TuNivelWidget';
import ObjetivoDiarioWidget from '../components/widgets/ObjetivoDiarioWidget';
import TuRachaWidget from '../components/widgets/TuRachaWidget';
import RepasoPendienteWidget from '../components/widgets/RepasoPendienteWidget';
import GenerarTestForm from '../components/forms/GenerarTestForm';
import SimulacroForm from '../components/forms/SimulacroForm';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <>
      {user?.oposicionPreferidaId ? <ResumenOposicionWidget /> : <ConfigurarOposicionWidget />}
      <TestRecomendadoWidget />
      <FocoHoyWidget />
      <ResumenSemanaWidget />
      <Actividad14Widget />
      <TemasDebilesWidget />
      <InsightMensualWidget />
      <RendimientoModosWidget />
      <ProgresoSemanalWidget />
      <EficienciaWidget />
      <ConsistenciaDiariaWidget />
      <RitmoPreguntaWidget />
      <BalancePrecisionWidget />
      <TuNivelWidget />
      <ObjetivoDiarioWidget />
      <TuRachaWidget />
      <RepasoPendienteWidget />
      <GenerarTestForm />
      <SimulacroForm />
    </>
  );
}