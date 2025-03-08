import {Send} from "lucide-react"
import {useState} from "react"
import useStore from "../store"
import {Block} from "./block"

export default function RightPanel() {
    const {
        headerStack,
        leftStack,
        rightStack,
        footerStack,
        setHeaderStack,
        setLeftStack,
        setRightStack,
        setFooterStack,
    } = useStore((state) => state.project)

    const [message, setMessage] = useState({prompt: "", html: ""})
    const [suggestion, setSuggestion] = useState("") // Store API response
    const [loading, setLoading] = useState(false) // Loading state
    const selection = useStore((store) => store.project.selection)
    let selectedBlock = undefined
    if (selection) {
        switch (selection.stack) {
            case "header":
                selectedBlock = headerStack[selection.index]
                break
            case "left":
                selectedBlock = leftStack[selection.index]
                break
            case "right":
                selectedBlock = rightStack[selection.index]
                break
            case "footer":
                selectedBlock = footerStack[selection.index]
                break
            default:
                selectedBlock = undefined
        }
    }
    function replaceSelectedBlock(block: Block) {
        if (!selection) return
        switch (selection.stack) {
            case "header":
                setHeaderStack(
                    headerStack.map((_, i) => (i === selection.index ? block : _)),
                )
                break
            case "left":
                setLeftStack(
                    leftStack.map((_, i) => (i === selection.index ? block : _)),
                )
                break
            case "right":
                setRightStack(
                    rightStack.map((_, i) => (i === selection.index ? block : _)),
                )
                break
            case "footer":
                setFooterStack(
                    footerStack.map((_, i) => (i === selection.index ? block : _)),
                )
                break
            default:
                selection.stack satisfies never
        }
    }

    const handleSend = async () => {
        const html = [...headerStack, ...leftStack, ...rightStack, ...footerStack]
            .map((component) => component.jsx)
            .join("\n")
        console.log(html)
        const requestBody = {prompt: message.prompt, html}
        setMessage({...message, html})
        setLoading(true)
        console.log(requestBody)
        try {
            const response = await fetch("https://ui-ai.onrender.com/suggest", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) throw new Error("Failed to fetch suggestions")

            const data = await response.json()
            setSuggestion(data.suggestion) // Store the AI suggestion
        } catch (error) {
            setSuggestion("Error fetching suggestions.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full w-full bg-neutral-100 p-4 rounded-xl shadow-lg border border-neutral-200 border-r-0 rounded-r-none">
            <h2 className="ml-2 font-semibold">Ask AI For Suggestions</h2>

            <div className="flex items-center gap-2 p-2 border-neutral-300">
                <textarea
                    placeholder="Suggest some improvements to the current design"
                    className="flex-1 bg-neutral-50 text-black border-neutral-600 border p-2 rounded-lg resize-none"
                    value={message.prompt}
                    onChange={(e) => setMessage({...message, prompt: e.target.value})}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                />
                <button
                    onClick={handleSend}
                    className="p-2 rounded-lg bg-neutral-100 border border-neutral-400 hover:bg-neutral-400"
                    disabled={loading}
                >
                    {loading ? "Loading..." : <Send size={20} />}
                </button>
            </div>

            {suggestion && (
                <div className="mt-4 p-4 bg-neutral-100 rounded-lg overflow-auto">
                    <h3 className="font-semibold text-lg">AI Suggestion:</h3>
                    <p className="text-sm text-neutral-700 whitespace-pre-line">
                        {suggestion
                            .split("**")
                            .map((part, index) =>
                                index % 2 === 1 ?
                                    <strong key={index}>{part}</strong>
                                :   part,
                            )}
                    </p>
                </div>
            )}

            {selectedBlock && (
                <div className="flex flex-col">
                    <code className="text-sm bg-amber-200 rounded p-2">
                        {selectedBlock.jsx}
                    </code>

                    <span className="font-semibold text-lg">Properties</span>

                    {Object.entries(selectedBlock.allowedProps).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                            <span className="font-semibold">{key}</span>
                            <select
                                value={selectedBlock.props[key] as string}
                                onChange={(e) =>
                                    replaceSelectedBlock({
                                        ...selectedBlock,
                                        props: {
                                            ...selectedBlock.props,
                                            [key]: e.target.value,
                                        },
                                    })
                                }
                            >
                                {value.values.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
