import React from 'react';
import * as constants from '../constants';
import Applet from '../Applet';

export type GenericInputValue
  = { case: 'string', value: string }
  | { case: 'number', min?: number, max?: number, value: number }
  | { case: 'boolean', value: boolean }

export type GenericInputs = { [key: string]: GenericInputValue }



export function ResultQueueApplet<Inputs extends GenericInputs, GenerationState, Result>(
  props:
    {
      title: string,
      defaultInputs: Inputs,
      initialGenerationState: (inputs: Inputs) => GenerationState,
      generateResult: (inputs: Inputs, state: GenerationState, setState: React.Dispatch<React.SetStateAction<GenerationState>>) => Promise<Result>,
      renderResult: (inputs: Inputs, state: GenerationState, result?: Result) => JSX.Element,
      resultsStyle?: React.CSSProperties
    }
): JSX.Element {
  const [resultElements, setResultElements] = React.useState<JSX.Element[]>([]);
  const [inputs, setInputs] = React.useState<Inputs>(props.defaultInputs);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResultElements([
      ...resultElements,
      (<Result
        key={resultElements.length}
        inputs={structuredClone(inputs)}
        initialGenerationState={props.initialGenerationState}
        generateResult={props.generateResult}
        renderResult={props.renderResult}
      />)
    ])
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const target = event.target;
    const key = target.name;
    const value =
      target instanceof HTMLInputElement ? (target.type === 'checkbox' ? target.checked : target.value) :
        target instanceof HTMLTextAreaElement ? target.value :
          "impossible";
    setInputs({ ...inputs, [key]: { ...props.defaultInputs[key], value } });
  }

  function renderInput(key: string): JSX.Element {
    const value: GenericInputValue = inputs[key];
    const valueElement: JSX.Element = (() => {
      switch (value.case) {
        // case 'string': return (<input type='text' name={key} value={value.value} onChange={handleChange} />)
        case 'string': return (<textarea name={key} value={value.value} onChange={handleChange}></textarea>)
        case 'number': return (<input type='number' name={key} min={value.min} max={value.max} value={value.value} onChange={handleChange} />)
        case 'boolean': return (<input type='checkbox' name={key} checked={value.value} onChange={handleChange} />)
      }
    })();
    return (
      <tr key={key}>
        <td style={{
          verticalAlign: "top",
          textAlign: "right",
          fontWeight: "bold",
          maxWidth: "20em",
          overflowWrap: "break-word",
          paddingBottom: "1em",
          paddingRight: "1em",
        }}><div>{key}</div></td>
        <td style={{
          verticalAlign: "top",
        }}><div>{valueElement}</div>
        </td>
      </tr >
    )
  }

  return (
    <Applet title={props.title}>
      <form /** inputs */
        onSubmit={handleSubmit}
        style={{
          width: "fit-content",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          background: "darkgray",
        }}>
        <table>
          <tbody>
            {Object.keys(props.defaultInputs).map((key) => renderInput(key))}
          </tbody>
        </table>
        <SubmitButton />
      </form>
      <div /** results */
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          alignItems: "flex-start",
          gap: "1em",
          ...props.resultsStyle
        }}>
        {resultElements}
      </div>
    </Applet >
  )
}

function SubmitButton(props: {}) {
  const [hover, setHover] = React.useState(false);

  return (
    <button
      type="submit"
      style={{
        border: "none",
        cursor: "pointer",
        // width: "14em",
        width: "100%",
        height: "2em",
        fontWeight: "bold",
        color: constants.button_color,
        background: hover ? constants.button_hover_background : constants.button_background,
      }}
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
    >Submit</button>
  )
}

function Result<Inputs extends GenericInputs, GenerationState, Result>(
  props: {
    inputs: Inputs,
    initialGenerationState: (inputs: Inputs) => GenerationState,
    generateResult: (inputs: Inputs, state: GenerationState, setState: React.Dispatch<React.SetStateAction<GenerationState>>) => Promise<Result>,
    renderResult: (inputs: Inputs, state: GenerationState, result?: Result) => JSX.Element,
  }
): JSX.Element {
  const [state, setState] = React.useState(props.initialGenerationState(props.inputs));
  const [result, setResult] = React.useState<Result | undefined>(undefined);

  React.useEffect(() => {
    props.generateResult(props.inputs, state, setState).then(setResult);
  }, []);

  return props.renderResult(props.inputs, state, result);
}