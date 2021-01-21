class GamePermissions {
    public canPlayWhite: boolean = false
    public canPlayBlack: boolean = false
    public methods: string[] = []

    public static get Spectator() {
        return new GamePermissions()
    }

    public static get BlackPlayer() {
        return {
            ...GamePermissions.Spectator,
            canPlayBlack: true
        }
    }

    public static get WhitePlayer() {
        return {
            ...GamePermissions.Spectator,
            canPlayWhite: true
        }
    }

    public static get Admin() {
        return {
            canPlayBlack: true,
            canPlayWhite: true,
            methods: [
                "undo", "reset", "remove", "put", "move", "load_pgn", "load", "clear"
            ]
        }
    }
}

export default GamePermissions