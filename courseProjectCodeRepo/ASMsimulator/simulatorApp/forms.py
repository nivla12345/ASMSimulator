from django import forms

from models import *


# Form used in the Registration page
class RegistrationForm(forms.Form):
    username = forms.CharField(max_length=50)
    first_name = forms.CharField(max_length=50)
    last_name = forms.CharField(max_length=50)
    email = forms.EmailField(max_length=50)
    password1 = forms.CharField(max_length=50,
                                # min_length = 6,
                                widget=forms.PasswordInput())
    password2 = forms.CharField(max_length=50,
                                # min_length = 6,
                                widget=forms.PasswordInput())

    # Customizes form validation for properties that apply to more
    # than one field.  Overrides the forms.Form.clean function.
    def clean(self):
        # Calls our parent (forms.Form) .clean function, gets a dictionary
        # of cleaned data as a result
        cleaned_data = super(RegistrationForm, self).clean()

        # Confirms that the two password fields match
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords did not match.")

        # We must return the cleaned data we got from our parent.
        return cleaned_data

    # Customizes form validation for the username field.
    def clean_username(self):
        # Confirms that the username is not already present in the
        # User model database.
        username = self.cleaned_data.get('username')
        if User.objects.filter(username__exact=username):
            raise forms.ValidationError("Username is already taken.")

        # We must return the cleaned data we got from the cleaned_data
        # dictionary
        return username

    # Customizes form validation for the email field.
    def clean_email(self):
        # Confirms that the email is not already present in the
        # User model database.
        email = self.cleaned_data.get('email')
        if Profile.objects.filter(email__exact=email):
            raise forms.ValidationError("Email is already taken.")

        # We must return the cleaned data we got from the cleaned_data
        # dictionary
        return email


# Password Form in edit profile
class PasswordForm(forms.Form):
    password = forms.CharField(max_length=50,
                               # min_length = 6,
                               widget=forms.PasswordInput())
    password1 = forms.CharField(max_length=50,
                                # min_length = 6,
                                widget=forms.PasswordInput())
    password2 = forms.CharField(max_length=50,
                                # min_length = 6,
                                widget=forms.PasswordInput())

    def clean(self):
        # Calls our parent (forms.Form) .clean function, gets a dictionary
        # of cleaned data as a result
        cleaned_data = super(PasswordForm, self).clean()
        # Confirms that the two password fields match
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords did not match.")

        # We must return the cleaned data we got from our parent.
        return cleaned_data


# ForgotPassword Form in registration
class ResetForm(forms.Form):
    email = forms.EmailField(max_length=50)

    def clean_email(self):
        email = self.cleaned_data.get('email')

        if not Profile.objects.filter(email__exact=email):
            raise forms.ValidationError("No account associated with this Email")
        # We must return the cleaned data we got from our parent.
        return email


# Reset Password Form
class ResetPasswordForm(forms.Form):
    password1 = forms.CharField(max_length=50,
                                # min_length = 6,
                                widget=forms.PasswordInput())
    password2 = forms.CharField(max_length=50,
                                # min_length = 6,
                                widget=forms.PasswordInput())

    def clean(self):
        # Calls our parent (forms.Form) .clean function, gets a dictionary
        # of cleaned data as a result
        cleaned_data = super(ResetPasswordForm, self).clean()

        # Confirms that the two password fields match
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords did not match.")

        # We must return the cleaned data we got from our parent.
        return cleaned_data


# ModelForm of the Profile model
class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        widgets = {
            'first_name': forms.TextInput(attrs={'size': '20'}),
            'last_name': forms.TextInput(attrs={'size': ' 20'}),
            'email': forms.EmailInput(attrs={'size': ' 20'}),
            'about': forms.TextInput(attrs={'size': ' 20'}),
            'picture': forms.FileInput(attrs={'size': ' 20'})}
        exclude = ('user', 'following', 'blocking', 'premium', 'space_left', 'followed_by', 'blocked_by')


# SearchForm in home page
class SearchForm(forms.Form):
    searchtext = forms.CharField(max_length=50,
                                 widget=forms.TextInput(attrs={'size': '49'}))


# FileForm in home page
class FileForm(forms.ModelForm):
    class Meta:
        model = AsmFile
        widgets = {
            'name': forms.TextInput(attrs={'size': '20'}),
            'description': forms.TextInput(attrs={'size': '20'}),
            'public': forms.CheckboxInput()}
        exclude = ('file', 'created_date', 'last_modified', 'creator', 'owner',
                   'downloads', 'favorites', 'version')
