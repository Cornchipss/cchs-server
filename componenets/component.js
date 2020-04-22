module.exports = class
{
    constructor()
    {
        this.action.bind(this);
    }

    /**
     * Gets the app ready to handle all requests from this component
     * @param {Object} app The app handling the requests 
     */
    init(app) {}

    /**
     * Handles the main functionality of this component
     * @param {object} req The request sent by the client
     * @param {object} res The result to be sent back to the client
     * @param {Function} next Advances express to the next receiver of this request
     */
    action(req, res, next) {}
}