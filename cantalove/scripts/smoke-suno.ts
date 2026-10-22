/** Real provider smoke test. NO mocks, no payment, no customer data.
 * Requires APIFRAME_API_KEY. Saves job before polling, resumes on rerun.
 * Never delete its state or submit again until the provider charge is reconciled.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { submitSunoGeneration, getJobStatus, fetchPrivateTrack } from '../src/lib/apiframe';
const statePath='.runtime/suno-smoke.json';
async function main(){
 if(existsSync('.env.local'))process.loadEnvFile('.env.local');
 if(!process.env.APIFRAME_API_KEY)throw new Error('Falta APIFRAME_API_KEY. No se llamó al proveedor ni se generó una canción. Configura la clave en el entorno privado.');
 await mkdir('.runtime',{recursive:true,mode:0o700});
 let state:{jobId?:string;submissionStarted?:boolean;complete?:boolean}={};
 if(existsSync(statePath))state=JSON.parse(await readFile(statePath,'utf8'));
 if(state.complete){console.log('La prueba real ya se completó. Audios en .runtime; no se generó otra canción.');return}
 if(!state.jobId){
  if(state.submissionStarted)throw new Error('Inicio anterior ambiguo: reconciliar en Apiframe antes de otro submit. No se duplicará la generación.');
  await writeFile(statePath,JSON.stringify({submissionStarted:true}),{mode:0o600});
  const jobId=await submitSunoGeneration({title:'La tarde que empezó todo',genre:'Bolero',voice:'Femenina',duration:'2:00 min',brand:'love',lyrics:`[Verse 1]\nJosé trajo una sonrisa, María un café,\nen la lluvia de esa tarde se encontraron sin querer.\nMonterrey guardó el secreto, una mesa junto al sol,\ny entre historias y ventanas fue creciendo esta canción.\n[Chorus]\nLo nuestro siempre suena, cuando vuelves a reír,\nuna casa hecha de abrazos, un lugar para seguir.\nLo nuestro siempre suena, suave como amanecer,\ncada día una promesa que volvemos a escoger.\n[Verse 2]\nNo hicieron grandes planes, solo tiempo para hablar,\ncaminaron las esquinas que aprendieron a cuidar.\nSi la vida cambia el rumbo y comienza a llover,\nJosé toma su mano, María vuelve a creer.\n[Bridge]\nQue nos falten los relojes, que nos sobre el corazón,\nsiempre habrá en esta historia un espacio para dos.\n[Chorus]\nLo nuestro siempre suena, cuando vuelves a reír,\nuna casa hecha de abrazos, un lugar para seguir.\n[Outro]\nJosé y María, una tarde y un café,\nla canción de aquel encuentro que no dejará de ser.`});
  state={jobId,submissionStarted:true};await writeFile(statePath,JSON.stringify(state),{mode:0o600});
  console.log('Trabajo real enviado. Estado guardado para recuperar sin duplicar.');
 }
 const until=Date.now()+6*60000;
 while(Date.now()<until){
  const job=await getJobStatus(state.jobId!);
  if(job.status==='FAILED')throw new Error('El proveedor marcó fallida la generación; revisar créditos y causa en su consola. No se reintentó submit.');
  if(job.status==='COMPLETED'){
   if(!job.result?.tracks||job.result.tracks.length<2)throw new Error('El proveedor no entregó dos versiones.');
   for(let i=0;i<2;i++){const bytes=await fetchPrivateTrack(job.result.tracks[i].audioUrl!);await writeFile(`.runtime/suno-version-${i+1}.mp3`,bytes,{mode:0o600})}
   await writeFile(statePath,JSON.stringify({...state,complete:true,credits:job.creditCost??null}),{mode:0o600});
   console.log('Prueba REAL completa: dos MP3 recibidos y validados. Escucha humana/calidad aún necesaria.');return;
  }
  console.log('El proveedor sigue procesando. Puedes interrumpir y volver a ejecutar para recuperar el mismo trabajo.');
  await new Promise(resolve=>setTimeout(resolve,7000));
 }
 throw new Error('Sigue procesando. Ejecuta de nuevo para consultar el mismo trabajo; no se envía una generación nueva.');
}
void main().catch(error=>{console.error(error instanceof Error?error.message:'No se completó la prueba.');process.exitCode=1});
