#
# Dashboard flask app, lots of work to do still
#
# Author: Chuck Findlay <chuck@findlayis.me>
# License: LGPL v3.0
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from google.cloud import firestore
import os
import base64

app = Flask(__name__)
app.secret_key = os.urandom(24)

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0')

@app.route('/')
def indexpage():
    if 'username' in session:
        return render_template('index.html')
    else:
        return redirect(url_for('loginpage'))

#
# Simple logout handler. Redirects to loginpage
#
@app.route('/logout')
def logoutpage():
    if 'username' in session:
        session.pop('username')
    return redirect(url_for('loginpage'))


#
# Login page implementation
# Pretty simplistic - uses firestore to grab info
# TODO: OAUTH one of these days. This is a sloppy authentication system just used for testing for now
# TODO: Should at least hash the passwords. This works okay for the initial testing now, but before it gets run
#       on anything besides my own laptop while I'm coding it needs this hashing
#
@app.route('/login', methods=['GET', 'POST'])
def loginpage():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        db = firestore.Client()

        doc = db.collection(u'users').document(username).get()

        if doc.exists:
            # User exists in firestore

            if (doc.to_dict()['password'] == password):
                session['username'] = username
                return redirect(url_for('indexpage'))
            else:
                error = '''
                                                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                                            <a href="#" class="close" data-dismiss="alert">&times;</a>
                                            <strong>Error!</strong> Incorrect username or password.
                                        </div>
                '''
                return render_template('login.html', error=error)
    
        else:
            error = '''
                                            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                                        <a href="#" class="close" data-dismiss="alert">&times;</a>
                                        <strong>Error!</strong> Incorrect username or password.
                                    </div>
            '''
            return render_template('login.html', error=error)

    else:
        return render_template('login.html')

@app.route('/get/meters/labels')
def getmeterlabels():
    if 'username' not in session:
        return 'Not authenticated'

    db = firestore.Client()

    # Give the labels for the Main TX's FWD power
    doc = db.collection(u'settings').document(u'maintxfwd').get()
    result = []
    doc_dict = doc.to_dict()

    for key in doc_dict:
        result.append({'label':doc_dict[key]})

    # Reflected power
    doc = db.collection(u'settings').document(u'maintxrfl').get()
    doc_dict = doc.to_dict()

    for key in doc_dict:
        result.append({'label':doc_dict[key]})

    # Now temperatures
    doc = db.collection(u'settings').document(u'temps').get()
    doc_dict = doc.to_dict()

    for key in doc_dict:
        result.append({'label':doc_dict[key]})

    # Main TX's amperage
    doc = db.collection(u'settings').document(u'maintxamps').get()
    doc_dict = doc.to_dict()

    for key in doc_dict:
        result.append({'label':doc_dict[key]})

    return jsonify(result)

@app.route('/get/meters/label/<id>')
def getmeterlabeldata(id):
    if 'username' not in session:
        return 'Not authenticated'

    db = firestore.Client()
    result = []

    # JS btoa used in case weird stuff is going on with the label
    doc = db.collection('meters').where(u'label', u'==', base64.b64decode(id).decode('utf-8')).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(168).get()
    for x in doc:
        result.append(x.to_dict())

    return jsonify(result)