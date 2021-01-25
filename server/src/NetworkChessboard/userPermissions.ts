class GamePermissions {
    public canConnect: boolean = false
    public canPlayWhite: boolean = false
    public canPlayBlack: boolean = false
    public methods: string[] = []

    public static get NotAllowed(): GamePermissions {
        return new GamePermissions()
    }

    public static get Spectator(): GamePermissions {
        return {
            ...new GamePermissions(),
            canConnect: true    
        }
    }

    public static get BlackPlayer(): GamePermissions {
        return {
            ...GamePermissions.Spectator,
            canPlayBlack: true
        }
    }

    public static get WhitePlayer(): GamePermissions {
        return {
            ...GamePermissions.Spectator,
            canPlayWhite: true
        }
    }

    public static get Admin(): GamePermissions {
        return {
            canConnect: true,
            canPlayBlack: true,
            canPlayWhite: true,
            methods: [
                "undo", "reset", "remove", "put", "move", "load_pgn", "load", "clear"
            ]
        }
    }
}

export default GamePermissions