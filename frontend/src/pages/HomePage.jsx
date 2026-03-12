import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from '../services/catalogApi';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [oposiciones, setOposiciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState({ oposicionId: '', materiaId: '', temaId: '', numeroPreguntas: 10 });

  useEffect(() => {
    catalogApi
      .getOposiciones()
      .then(setOposiciones)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const onOposicion = async (id) => {
    setSelection({ ...selection, oposicionId: id, materiaId: '', temaId: '' });
    setMaterias([]);
    setTemas([]);
    if (!id) return;
    const data = await catalogApi.getMaterias(id);
    setMaterias(data);
  };

  const onMateria = async (id) => {
    setSelection({ ...selection, materiaId: id, temaId: '' });
    setTemas([]);
    if (!id) return;
    const data = await catalogApi.getTemas(id);
    setTemas(data);
  };

  const onGenerate = async () => {
    setError('');
    try {
      const test = await testApi.generate(token, {
        temaId: Number(selection.temaId),
        numeroPreguntas: Number(selection.numeroPreguntas),
      });
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <p>Cargando catálogo...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section className="card">
      <h2>Generar test</h2>
      <div className="form-grid">
        <select value={selection.oposicionId} onChange={(e) => onOposicion(e.target.value)}>
          <option value="">Selecciona oposición</option>
          {oposiciones.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <select value={selection.materiaId} onChange={(e) => onMateria(e.target.value)} disabled={!selection.oposicionId}>
          <option value="">Selecciona materia</option>
          {materias.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <select value={selection.temaId} onChange={(e) => setSelection({ ...selection, temaId: e.target.value })} disabled={!selection.materiaId}>
          <option value="">Selecciona tema</option>
          {temas.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="5"
          max="100"
          value={selection.numeroPreguntas}
          onChange={(e) => setSelection({ ...selection, numeroPreguntas: e.target.value })}
        />
      </div>

      <button disabled={!selection.temaId} onClick={onGenerate}>
        Generar test
      </button>
    </section>
  );
}