export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#1e1e1c]">
            <div className="text-center space-y-4">
                <div className="relative flex items-center justify-center gap-2">
                    <span className="text-4xl text-amber-400/90 animate-pulse">✦</span>
                    <span className="text-xl font-normal italic text-white" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                        MAR Chat
                    </span>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 border-[#333] border-t-amber-400/90 animate-spin" />
                </div>
                <p className="text-[#c1c0b5]/80 font-medium">
                    Loading...
                </p>
            </div>
        </div>
    );
}
